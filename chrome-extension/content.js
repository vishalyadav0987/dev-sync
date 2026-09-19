// Inject the interceptor script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

let lastAcceptedProblem = null;
let lastSubmissionTime = 0;

function notifyAccepted() {
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

    console.log("LeetCode Submission Accepted detected via DOM!");
    chrome.runtime.sendMessage({
        type: 'PROCESS_SUBMISSION',
        payload: { submissionId: now.toString(), problemSlug }
    });
}

// Listen for messages from the injected script (Network Interception)
window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data.type === 'LEETCODE_SUBMISSION_ACCEPTED') {
        notifyAccepted();
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
