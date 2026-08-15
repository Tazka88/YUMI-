const { spawn } = require('child_process');
const http = require('http');

const server = spawn('node', ['dist/server.cjs'], {
  env: { ...process.env, PORT: '3001', NODE_ENV: 'production' }
});

server.stdout.on('data', (data) => console.log(`Server: ${data}`));
server.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

setTimeout(() => {
  const slugs = [
    "pack-lisseur-brosse-boucleur-990-f-50w-enzo-en-3955w",
    "gel-visage-hydratant-acide-hyaluronique-35-touche-30ml",
    "machine-de-mise-sous-vide-alimentaire-appareil-de-conservation-des-aliments-scelleuse-sous-vide-avec-extraction-d-air-cuisine-et-maison",
    "tondeuse-professionnelle-sans-fil-lame-inox-et-cran-led-kemei-km-1866",
    "robuste-lisseur-plaque-en-ceramique-enrichie-nano-ceramic-noir-rose"
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
      
      const canonicals = html.match(/<link rel="canonical" href="([^"]+)"/g);
      if (!canonicals) {
          console.log("Canonical: ERROR - None found");
      } else {
          console.log(`Canonical Count: ${canonicals.length}`);
          const match = canonicals[0].match(/href="([^"]+)"/);
          console.log(`Canonical URL: ${match ? match[1] : 'N/A'} (startsWith www.zorando.com: ${match && match[1].startsWith('https://www.zorando.com')})`);
      }

      const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      if (jsonLdMatch) {
        console.log("JSON-LD: Found in initial HTML");
        try {
          const ld = JSON.parse(jsonLdMatch[1]);
          console.log(`- Type: ${ld['@type']}`);
          console.log(`- Name: ${ld.name}`);
          console.log(`- Image: ${ld.image ? 'Present' : 'Missing'}`);
          console.log(`- Brand: ${ld.brand && ld.brand.name}`);
          console.log(`- SKU: ${ld.sku}`);
          console.log(`- URL: ${ld.offers && ld.offers.url}`);
          console.log(`- PriceCurrency: ${ld.offers && ld.offers.priceCurrency}`);
          console.log(`- Availability: ${ld.offers && ld.offers.availability}`);
          console.log(`- Price: ${ld.offers && ld.offers.price}`);
          console.log(`- PriceValidUntil: ${ld.offers && ld.offers.priceValidUntil ? ld.offers.priceValidUntil : 'Not present'}`);
        } catch (e) {
          console.log("JSON-LD: ERROR parsing JSON");
        }
      } else {
        console.log("JSON-LD: ERROR - Not found");
      }

      const hasHidden = html.includes('display:none') && html.includes('seo-content');
      console.log(`Hidden SEO Content: ${hasHidden ? 'Found (ERROR)' : 'None (Good)'}`);
    }

    server.kill();
    process.exit(0);
  }

  verify().catch(e => {
    console.error(e);
    server.kill();
    process.exit(1);
  });
}, 2000);
