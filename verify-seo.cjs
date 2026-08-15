const http = require('http');

const slugs = [
  "pack-lisseur-brosse-boucleur-990-f-50w-enzo-en-3955w",
  "gel-visage-hydratant-acide-hyaluronique-35-touche-30ml",
  "machine-de-mise-sous-vide-alimentaire-appareil-de-conservation-des-aliments-scelleuse-sous-vide-avec-extraction-d-air-cuisine-et-maison",
  "tondeuse-professionnelle-sans-fil-lame-inox-et-cran-led-kemei-km-1866",
  "robuste-lisseur-plaque-en-ceramique-enrichie-nano-ceramic-noir-rose"
];

function fetchHTML(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
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
    
    // 1. Single canonical tag & 2. URL format
    const canonicals = html.match(/<link rel="canonical" href="([^"]+)"/g);
    if (!canonicals) {
        console.log("Canonical: ERROR - None found");
    } else {
        console.log(`Canonical Count: ${canonicals.length}`);
        const match = canonicals[0].match(/href="([^"]+)"/);
        console.log(`Canonical URL: ${match ? match[1] : 'N/A'} (startsWith www.zorando.com: ${match && match[1].startsWith('https://www.zorando.com')})`);
    }

    // 3. JSON-LD present
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    if (jsonLdMatch) {
      console.log("JSON-LD: Found in initial HTML");
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        
        // 4. Content check
        console.log(`- Type: ${ld['@type']}`);
        console.log(`- Name: ${ld.name ? 'Present' : 'Missing'}`);
        console.log(`- Image: ${ld.image ? 'Present' : 'Missing'}`);
        console.log(`- Brand: ${ld.brand && ld.brand['@type'] === 'Brand' ? 'Present' : 'Missing'}`);
        console.log(`- SKU: ${ld.sku ? 'Present' : 'Missing'}`);
        console.log(`- URL: ${ld.offers && ld.offers.url ? ld.offers.url : 'Missing'}`);
        console.log(`- PriceCurrency: ${ld.offers && ld.offers.priceCurrency}`);
        console.log(`- Availability: ${ld.offers && ld.offers.availability}`);
        console.log(`- Price: ${ld.offers && ld.offers.price}`);
        console.log(`- PriceValidUntil: ${ld.offers && ld.offers.priceValidUntil ? ld.offers.priceValidUntil : 'Not present (Good if no end date)'}`);
        
      } catch (e) {
        console.log("JSON-LD: ERROR parsing JSON");
      }
    } else {
      console.log("JSON-LD: ERROR - Not found");
    }

    // 7. No hidden SEO content
    const hasHidden = html.includes('display:none') && html.includes('seo-content');
    console.log(`Hidden SEO Content: ${hasHidden ? 'Found (ERROR)' : 'None (Good)'}`);
  }

  // 9. Verify Sitemap
  console.log(`\n--- Verification for Sitemap ---`);
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

verify().catch(console.error);
