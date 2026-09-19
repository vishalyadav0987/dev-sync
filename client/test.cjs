const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  await page.goto('http://localhost:5173/blog');
  await page.waitForTimeout(2000);
  
  // Click the first article
  const articleLink = await page.$('a[href^="/blog/article/"]');
  if (articleLink) {
    console.log('Clicking article...');
    await articleLink.click();
    await page.waitForTimeout(2000);
    
    // Click Bookmark
    const bookmarkBtn = await page.$('button:has(svg.lucide-bookmark)');
    if (bookmarkBtn) {
      console.log('Clicking bookmark...');
      await bookmarkBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Go to saved page
    await page.goto('http://localhost:5173/blog/saved');
    await page.waitForTimeout(2000);
  } else {
    console.log('No article link found');
  }
  
  await browser.close();
})();
