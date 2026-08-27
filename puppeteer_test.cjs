const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="canonical"]')).map(l => l.outerHTML);
  });
  console.log(links);
  await browser.close();
})();
