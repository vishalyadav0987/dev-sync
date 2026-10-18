// Inject the interceptor script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

let lastAcceptedProblem = null;
let lastSubmissionTime = 0;

// This flag is set when inject.js detects a /submit/ API call.
// The MutationObserver will ONLY look for "Accepted" text if this is true.
// This prevents false-triggering when you just visit a previously-solved problem.
let userJustSubmitted = false;
let submitResetTimer = null;

function notifyAccepted(submissionId, language) {
    const now = Date.now();
    const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;

    if (!problemSlug) return;

    // Debounce: prevent firing multiple times for the same problem within 10 seconds
    if (lastAcceptedProblem === problemSlug && (now - lastSubmissionTime < 10000)) {
        return; 
    }

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

    console.log("[DevPortfolio] Submission Accepted detected! Submission ID:", finalSubmissionId);
    
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

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    // inject.js detected a /submit/ POST → arm the DOM observer for 60 seconds
    if (event.data.type === 'LEETCODE_SUBMIT_DETECTED') {
        console.log('[DevPortfolio] Submit detected — DOM observer armed');
        userJustSubmitted = true;
        if (submitResetTimer) clearTimeout(submitResetTimer);
        submitResetTimer = setTimeout(() => { userJustSubmitted = false; }, 60000);
    }

    // inject.js detected an Accepted response from the network
    if (event.data.type === 'LEETCODE_SUBMISSION_ACCEPTED') {
        const payload = event.data.payload || {};
        notifyAccepted(payload.submissionId, payload.language);
    }
});

// Fallback: MutationObserver — ONLY armed after a real submit is detected
// This catches edge cases where the /check/ endpoint doesn't fire but
// the DOM updates with "Accepted" after the user clicks Submit.
let domCheckTimeout = null;
const observer = new MutationObserver((mutations) => {
    // CRITICAL: Do NOT check the DOM unless the user just clicked Submit.
    // Without this guard, simply visiting a previously-solved problem
    // would trigger the sync (because LeetCode shows "Accepted" in the DOM).
    if (!userJustSubmitted) return;
    if (domCheckTimeout) return;

    domCheckTimeout = setTimeout(() => {
        domCheckTimeout = null;
        
        // Strategy 1: Data attribute
        const e2e = document.querySelector('[data-e2e-locator="submission-result"]');
        if (e2e && e2e.textContent.includes('Accepted')) {
            notifyAccepted();
            return;
        }

        // Strategy 2: Specific green text class used by LeetCode
        const greens = document.querySelectorAll('.text-green-s, .text-success, [class*="text-green-s"]');
        for (const el of greens) {
            if (el.textContent === 'Accepted') {
                notifyAccepted();
                return;
            }
        }
    }, 500);
});

const startObserver = () => {
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
        setTimeout(startObserver, 100);
    }
};

startObserver();
