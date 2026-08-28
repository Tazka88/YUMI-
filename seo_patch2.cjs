const fs = require('fs');

// Patch schemaUtils.ts
let schemaUtils = fs.readFileSync('src/lib/schemaUtils.ts', 'utf-8');
schemaUtils = schemaUtils.replace(
  '"sku": String(product.id),',
  '"sku": product.sku || String(product.id),\n    "identifier_exists": false,'
);
fs.writeFileSync('src/lib/schemaUtils.ts', schemaUtils);

// Patch api/index.ts
let apiIndex = fs.readFileSync('api/index.ts', 'utf-8');
const searchString = 'headHtml += `\\n<script type="application/ld+json">\\n${JSON.stringify(schemaData)}\\n</script>\\n`;';
const replaceString = `headHtml += \`\\n<script type="application/ld+json">\\n\${JSON.stringify(schemaData)}\\n</script>\\n\`;
          
          headHtml += \`<meta property="og:type" content="product" />\\n\`;
          headHtml += \`<meta name="twitter:card" content="summary_large_image" />\\n\`;
          headHtml += \`<meta property="product:price:amount" content="\${displayPrice}" />\\n\`;
          headHtml += \`<meta property="product:price:currency" content="DZD" />\\n\`;
          
          // Inject static HTML for Googlebot in the root div (Point 1, 4, 6)
          const staticBody = \`
            <div style="display:none;" id="seo-static-content">
              <h1>\${product.name}</h1>
              <img src="\${ogImage}" alt="\${product.name}" />
              <p><strong>Prix:</strong> \${displayPrice} DZD</p>
              <div>\${description}</div>
              <div>
                <h2>Catégories</h2>
                <ul>
                  <li><a href="\${baseUrl}/category/\${product.category_slug}">\${product.category_name}</a></li>
                </ul>
              </div>
            </div>
          \`;
          seoHtml = staticBody;`;
apiIndex = apiIndex.replace(searchString, replaceString);
apiIndex = apiIndex.replace(
  "let finalHtml = template.replace('<!--seo-injection-->', typeof seoHtml !== 'undefined' ? seoHtml : '');",
  "let finalHtml = template.replace('<div id=\"root\"></div>', `<div id=\"root\">${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>`);"
);
fs.writeFileSync('api/index.ts', apiIndex);

console.log("Patches applied successfully.");
