const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
  const metas = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('meta[property="og:title"]')).map(l => {
      let attrs = {};
      for (let attr of l.attributes) attrs[attr.name] = attr.value;
      return attrs;
    });
  });
  console.log(metas);
  await browser.close();
})();
