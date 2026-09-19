import fetch from 'node-fetch'; // fetch is native in Node 18+

async function testLogin() {
  const loginUrl = 'https://leetcode.com/accounts/login/';
  
  try {
    const init = await fetch(loginUrl);
    const text = await init.text();
    console.log("Status:", init.status);
    if (text.includes('captcha') || text.includes('turnstile') || init.status === 403) {
      console.log("Blocked by captcha/cloudflare.");
    } else {
      console.log("No captcha detected on init.");
    }
  } catch (e) {
    console.log(e.message);
  }
}

testLogin();
