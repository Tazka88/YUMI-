const http = require('http');

const slugs = [
  "piscine-ronde-gonflable-pour-enfants-102-x-025-m-bestway-51008",
  "piscine-sunset-glow-168-46-cm-intex"
];

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
  for (const slug of slugs) {
    const html = await fetchHTML(`/product/${slug}`);
    console.log(`\n--- Verification for: ${slug} ---`);
    
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        console.log(`- Availability: ${ld.offers && ld.offers.availability}`);
        console.log(`- Price: ${ld.offers && ld.offers.price}`);
      } catch (e) {
        console.log("JSON-LD: ERROR parsing JSON");
      }
    }
  }
}
verify();
