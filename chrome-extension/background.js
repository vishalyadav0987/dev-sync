const BACKEND_URL = "http://localhost:4000/api/leetcode/extension";

// 1. Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROCESS_SUBMISSION') {
    handleSubmission(message.payload);
  } else if (message.type === 'CHECK_STATUS') {
    // Popup wants to know current status
    checkStatusAndRespond(sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function checkLeetCodeAuth() {
  try {
    const query = `
      query globalData {
        userStatus {
          isSignedIn
          username
        }
      }
    `;

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    return data?.data?.userStatus || { isSignedIn: false };
  } catch (err) {
    console.error("Error checking LeetCode auth:", err);
    return { isSignedIn: false };
  }
}

async function linkBackend(username) {
  try {
    const res = await fetch(`${BACKEND_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leetcodeUsername: username })
    });
    const data = await res.json();
    if (data.success && data.guestId) {
      console.log("Successfully authenticated via LeetCode. Guest ID:", data.guestId);
      
      // Save it locally for future submissions
      await chrome.storage.local.set({ guestId: data.guestId });

      // Magic step: Push this guestId to any open DevPortfolio tabs so they are instantly logged in!
      chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
        tabs.forEach(tab => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (id) => {
              // Only overwrite if it's different, maybe reload to apply
              if (localStorage.getItem("dsa_guest_id") !== id) {
                localStorage.setItem("dsa_guest_id", id);
                console.log("Logged in via LeetCode extension! Reloading...");
                window.location.reload();
              }
            },
            args: [data.guestId]
          }).catch(err => console.log("Could not inject into tab:", err));
        });
      });

      return data.guestId;
    }
  } catch (err) {
    console.error("Failed to link backend:", err);
  }
  return null;
}

async function checkStatusAndRespond(sendResponse) {
  const lcStatus = await checkLeetCodeAuth();
  let devPortfolioLinked = false;
  let currentGuestId = null;
  
  if (lcStatus.isSignedIn) {
    // We only need LeetCode authentication now!
    currentGuestId = await linkBackend(lcStatus.username);
    if (currentGuestId) devPortfolioLinked = true;
  }

  sendResponse({
    devPortfolioLinked,
    leetCodeLinked: lcStatus.isSignedIn,
    username: lcStatus.username,
    guestId: currentGuestId
  });
}

async function handleSubmission(payload) {
  const { submissionId, problemSlug } = payload;
  
    // 1. Check if we are connected
    const { guestId } = await chrome.storage.local.get("guestId");
    if (!guestId) {
      console.warn("LeetCode Sync: Submission detected, but extension is not connected to DevPortfolio.");
      return;
    }
  
    // Helper to get CSRF token
    const getCsrfToken = () => {
      return new Promise((resolve) => {
        chrome.cookies.get({ url: "https://leetcode.com", name: "csrftoken" }, (cookie) => {
          resolve(cookie ? cookie.value : "");
        });
      });
    };
  
    try {
      const csrfToken = await getCsrfToken();
  
      // 2. Fetch latest submissions from LeetCode GraphQL
      const queryList = `
        query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
          submissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) {
            submissions {
              id
              statusDisplay
              lang
              timestamp
            }
          }
        }
      `;
  
      const graphqlResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-csrftoken": csrfToken,
            "Referer": "https://leetcode.com/"
        },
        body: JSON.stringify({ query: queryList, variables: { offset: 0, limit: 5, questionSlug: problemSlug } })
      });
  
      const graphqlData = await graphqlResponse.json();
      
      if (!graphqlData.data || !graphqlData.data.submissionList || !graphqlData.data.submissionList.submissions) {
        console.error("Failed to fetch submission details from LeetCode GraphQL", JSON.stringify(graphqlData));
        return;
      }

    const submissions = graphqlData.data.submissionList.submissions;
    const acceptedSubmission = submissions.find(s => s.statusDisplay === 'Accepted');
    
    if (!acceptedSubmission) {
      console.error("No accepted submission found for", problemSlug);
      return;
    }

    // 2.5 Fetch actual code for the submission
    const queryDetails = `
      query submissionDetails($submissionId: Int!) {
        submissionDetails(submissionId: $submissionId) {
          code
        }
      }
    `;

    const detailsResponse = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "x-csrftoken": csrfToken,
          "Referer": "https://leetcode.com/"
      },
      body: JSON.stringify({ query: queryDetails, variables: { submissionId: parseInt(acceptedSubmission.id) } })
    });

    const detailsData = await detailsResponse.json();
    const code = detailsData.data?.submissionDetails?.code || "";

    // LeetCode's submissionList sometimes doesn't give problemTitle directly, 
    // but we can just use the slug formatted as title for now, 
    // the backend will handle title anyway via Gemini if it's new.
    const problemTitle = problemSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const language = acceptedSubmission.lang;
    
    // We update submissionId to the actual one we found
    const actualSubmissionId = acceptedSubmission.id;

    // 3. Send to our backend
    const submitResponse = await fetch(`${BACKEND_URL}/submission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-extension-guest-id": guestId
      },
      body: JSON.stringify({
        submissionId: actualSubmissionId,
        problemSlug,
        problemTitle,
        language,
        code
      })
    });

    const submitResult = await submitResponse.json();
    
    if (submitResult.success && !submitResult.duplicate) {
      console.log(`Successfully synced submission for ${problemTitle}`);
      showSuccessFireEffect();
    } else if (submitResult.duplicate) {
      console.log(`Submission already synced for ${problemTitle}. No firework.`);
    } else {
      console.error(`Failed to sync submission for ${problemTitle}`);
    }

  } catch (error) {
    console.error("Error processing submission:", error);
  }
}

function showSuccessFireEffect() {
  // Change the whole extension icon to fire!
  chrome.action.setIcon({ path: "icons/fire.png" });
  
  // Optional: Add a text badge on top of it for extra pop
  chrome.action.setBadgeText({ text: '🔥' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF4500' });
  
  // Clear badge and revert icon after 2 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setIcon({ 
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      } 
    });
  }, 2000);
}
