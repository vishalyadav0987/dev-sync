// Inject script that overrides fetch and XHR to intercept submission results
(function () {
  // Track whether the user has actually clicked "Submit" in this page session.
  // This prevents false positives when LeetCode loads old submission details
  // (e.g., browsing the submissions tab of a previously solved problem).
  let activeSubmitTimestamp = 0;

  function isRecentSubmit() {
    // Only consider it a real submission if the user clicked Submit within the last 60 seconds
    return (Date.now() - activeSubmitTimestamp) < 60000;
  }

  // 1. Intercept Fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      let url = '';
      if (args[0] && typeof args[0] === 'string') url = args[0];
      else if (args[0] && args[0].url) url = args[0].url;

      // Detect the actual Submit action: POST to /problems/<slug>/submit/
      if (url.includes('/submit/') && args[1] && args[1].method === 'POST') {
        activeSubmitTimestamp = Date.now();
        console.log('[DevPortfolio] Submit action detected via fetch');
        window.postMessage({ type: 'LEETCODE_SUBMIT_DETECTED' }, '*');
      }

      // Primary: Intercept the /check/ polling endpoint
      // This endpoint is ONLY called when LeetCode is polling for the result
      // of a submission the user just made. It is never called when browsing.
      if (url.includes('/submissions/detail/') && url.includes('/check/')) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();

        if (data && data.state === 'SUCCESS' && data.status_msg === 'Accepted') {
          const submissionIdMatch = url.match(/detail\/(\d+)\/check/);
          const submissionId = submissionIdMatch ? submissionIdMatch[1] : null;
          const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
          const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;
          const language = data.lang;

          if (submissionId && problemSlug) {
            window.postMessage({
              type: 'LEETCODE_SUBMISSION_ACCEPTED',
              payload: { submissionId, problemSlug, language }
            }, '*');
          }
        }
      }
      // Secondary: GraphQL submissionDetails — ONLY if a submit was recently triggered
      // Without the isRecentSubmit() guard, this fires when you browse old submissions
      else if ((url.includes('/graphql') || url.includes('/graphql/')) && isRecentSubmit()) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          if (data && data.data && data.data.submissionDetails) {
            const details = data.data.submissionDetails;
            if (details.statusCode === 10 || details.statusDisplay === 'Accepted') {
              const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
              const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;
              const language = details.lang?.name || details.lang || null;
              
              let submissionId = null;
              if (args[1] && args[1].body) {
                try {
                  const reqBody = typeof args[1].body === 'string' ? JSON.parse(args[1].body) : null;
                  if (reqBody && reqBody.variables && reqBody.variables.submissionId) {
                    submissionId = reqBody.variables.submissionId.toString();
                  }
                } catch(e) {}
              }
              if (!submissionId) {
                const urlMatch = window.location.pathname.match(/\/submissions\/(?:detail\/)?(\d+)/);
                if (urlMatch) submissionId = urlMatch[1];
              }
              
              if (problemSlug && submissionId) {
                window.postMessage({
                  type: 'LEETCODE_SUBMISSION_ACCEPTED',
                  payload: { submissionId, problemSlug, language }
                }, '*');
              }
            }
          }
        } catch(e) {}
      }
    } catch (err) {
      console.error('Error intercepting LeetCode fetch submission:', err);
    }
    return response;
  };

  // 2. Intercept XMLHttpRequest
  const xhrOpen = window.XMLHttpRequest.prototype.open;
  const xhrSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    return xhrOpen.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      try {
        const url = this._url;
        if (url && typeof url === 'string') {
          // Detect Submit action via XHR
          if (url.includes('/submit/') && this._method === 'POST') {
            activeSubmitTimestamp = Date.now();
            console.log('[DevPortfolio] Submit action detected via XHR');
            window.postMessage({ type: 'LEETCODE_SUBMIT_DETECTED' }, '*');
          }

          // Primary: /check/ polling (only happens during active submissions)
          if (url.includes('/submissions/detail/') && url.includes('/check/')) {
            const data = JSON.parse(this.responseText);
            if (data && data.state === 'SUCCESS' && data.status_msg === 'Accepted') {
              const submissionIdMatch = url.match(/detail\/(\d+)\/check/);
              const submissionId = submissionIdMatch ? submissionIdMatch[1] : null;
              const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
              const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;
              const language = data.lang;

              if (submissionId && problemSlug) {
                window.postMessage({
                  type: 'LEETCODE_SUBMISSION_ACCEPTED',
                  payload: { submissionId, problemSlug, language }
                }, '*');
              }
            }
          }
          // Secondary: GraphQL — ONLY if user recently submitted
          else if ((url.includes('/graphql') || url.includes('/graphql/')) && isRecentSubmit()) {
            const data = JSON.parse(this.responseText);
            if (data && data.data && data.data.submissionDetails) {
              const details = data.data.submissionDetails;
              if (details.statusCode === 10 || details.statusDisplay === 'Accepted') {
                const problemSlugMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
                const problemSlug = problemSlugMatch ? problemSlugMatch[1] : null;
                const language = details.lang?.name || details.lang || null;
                
                let submissionId = null;
                const urlMatch = window.location.pathname.match(/\/submissions\/(?:detail\/)?(\d+)/);
                if (urlMatch) {
                  submissionId = urlMatch[1];
                }

                if (problemSlug && submissionId) {
                  window.postMessage({
                    type: 'LEETCODE_SUBMISSION_ACCEPTED',
                    payload: { submissionId, problemSlug, language }
                  }, '*');
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error intercepting LeetCode XHR submission:', err);
      }
    });
    return xhrSend.apply(this, arguments);
  };
})();
