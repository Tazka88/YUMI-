const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="canonical"]')).map(l => l.outerHTML);
  });
  console.log("Canonical:", links);
  const metas = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('meta[property="og:title"]')).map(l => l.outerHTML);
  });
  console.log("Meta Title:", metas);
  await browser.close();
})();
