const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.head.innerHTML);
  console.log(html);
  await browser.close();
})();
