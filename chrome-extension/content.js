// Inject the interceptor script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

let lastAcceptedProblem = null;
let lastSubmissionTime = 0;

function notifyAccepted(submissionId, language) {
    const now = Date.now();
    const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;

    if (!problemSlug) return;

    // Debounce: prevent firing multiple times for the same problem within 10 seconds
    if (lastAcceptedProblem === problemSlug && (now - lastSubmissionTime < 10000)) {
        return; 
    }

    // Only allow triggering once per problem per page session to prevent endless loops
    // If they submit again after 10s, it will trigger again, which is good.
    lastAcceptedProblem = problemSlug;
    lastSubmissionTime = now;

    let finalSubmissionId = submissionId;
    if (!finalSubmissionId) {
        const urlMatch = window.location.pathname.match(/\/submissions\/(?:detail\/)?(\d+)/);
        if (urlMatch) {
            finalSubmissionId = urlMatch[1];
        } else {
            finalSubmissionId = now.toString();
        }
    }

    console.log("LeetCode Submission Accepted detected! Submission ID:", finalSubmissionId);
    
    // In MV3, sendMessage without a callback returns a Promise. We must catch it.
    chrome.runtime.sendMessage({
        type: 'PROCESS_SUBMISSION',
        payload: { submissionId: finalSubmissionId, problemSlug, language }
    }).catch((error) => {
        if (error.message && error.message.includes("Extension context invalidated")) {
            console.error("Extension context invalidated. Please refresh the page.");
            alert("DevPortfolio Extension was updated in the background. Please refresh this page (Cmd+R or Ctrl+R) to reconnect it!");
        } else {
            console.error("Error sending message to extension:", error);
            alert("DevPortfolio Sync Error: " + error.message);
        }
    });
}

// Listen for messages from the injected script (Network Interception)
window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data.type === 'LEETCODE_SUBMISSION_ACCEPTED') {
        const payload = event.data.payload || {};
        notifyAccepted(payload.submissionId, payload.language);
    }
});

// Fallback: MutationObserver to watch for the "Accepted" text (DOM Interception)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            // Check for the "Accepted" span which is usually colored green in LeetCode's new UI
            // Typically it has data-e2e-locator="submission-result" or is just a span with color text-green-s
            const spans = document.querySelectorAll('span, div');
            for (let i = 0; i < spans.length; i++) {
                const el = spans[i];
                if (el.innerText && el.innerText.trim() === 'Accepted') {
                    // Make sure it's the large success text, usually it has a specific green color class
                    // or it appears near the runtime/memory stats.
                    if ((typeof el.className === 'string' && (el.className.includes('green') || el.className.includes('success'))) || el.getAttribute('data-e2e-locator') === 'submission-result') {
                        notifyAccepted();
                        return;
                    }
                }
            }
        }
    }
});

const startObserver = () => {
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
        setTimeout(startObserver, 100);
    }
};

startObserver();
