const http = require('http');

function fetchHTML(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function verify() {
  const sitemap = await fetchHTML('/sitemap.xml');
  const urls = sitemap.match(/<loc>(.*?)<\/loc>/g);
  let allWww = true;
  let nonWwwCount = 0;
  if (urls) {
    urls.forEach(u => {
      if (!u.includes('https://www.zorando.com')) {
        allWww = false;
        nonWwwCount++;
      }
    });
    console.log(`Sitemap URLs checked: ${urls.length}`);
    console.log(`All use https://www.zorando.com: ${allWww ? 'Yes' : 'No (' + nonWwwCount + ' errors)'}`);
  } else {
    console.log("Sitemap: ERROR - No URLs found");
  }
}
verify();
