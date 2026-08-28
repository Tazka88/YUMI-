const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/product/tondeuse-cheveux-rechargeable-6w-kemei-km-1838', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.head.innerHTML);
  console.log(html.includes('AggregateRating'));
  await browser.close();
})();
