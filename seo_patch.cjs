const fs = require('fs');

// Patch schemaUtils.ts
let schemaUtils = fs.readFileSync('src/lib/schemaUtils.ts', 'utf-8');
schemaUtils = schemaUtils.replace(
  /"sku": String\(product\.id\),/g,
  '"sku": product.sku || String(product.id),\n    "identifier_exists": false,'
);
fs.writeFileSync('src/lib/schemaUtils.ts', schemaUtils);

// Patch api/index.ts
let apiIndex = fs.readFileSync('api/index.ts', 'utf-8');
apiIndex = apiIndex.replace(
  /headHtml \+= `\\n<script type="application\\/ld\+json">\\n\$\{JSON\.stringify\(schemaData\)\}\\n<\/script>\\n`;/g,
  `headHtml += \`\\n<script type="application/ld+json">\\n\${JSON.stringify(schemaData)}\\n</script>\\n\`;
          
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
              <p>\${description}</p>
              <div>
                <h2>Catégories</h2>
                <ul>
                  <li><a href="\${baseUrl}/category/\${product.category_slug}">\${product.category_name}</a></li>
                </ul>
              </div>
            </div>
          \`;
          seoHtml = staticBody;`
);
apiIndex = apiIndex.replace(
  /let finalHtml = template\.replace\('<!--seo-injection-->', typeof seoHtml !== 'undefined' \? seoHtml : ''\);/g,
  `let finalHtml = template.replace('<div id="root"></div>', \`<div id="root">\${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>\`);`
);
fs.writeFileSync('api/index.ts', apiIndex);

// Patch server.ts
let serverTs = fs.readFileSync('server.ts', 'utf-8');
serverTs = serverTs.replace(
  /seoHtml = `<script type="application\\/ld\+json">\$\{JSON\.stringify\(graphSchema\)\}<\/script>`;/g,
  `
            headHtml += \`<meta property="og:type" content="product" />\\n\`;
            headHtml += \`<meta name="twitter:card" content="summary_large_image" />\\n\`;
            headHtml += \`<meta property="product:price:amount" content="\${displayPrice}" />\\n\`;
            headHtml += \`<meta property="product:price:currency" content="DZD" />\\n\`;
            
            const staticBody = \`
              <div style="display:none;" id="seo-static-content">
                <h1>\${product.name}</h1>
                <img src="\${ogImage}" alt="\${product.name}" />
                <p><strong>Prix:</strong> \${displayPrice} DZD</p>
                <p>\${description}</p>
                <div>
                  <h2>Catégories</h2>
                  <ul>
                    <li><a href="\${baseUrl}/category/\${product.category_slug}">\${product.category_name}</a></li>
                  </ul>
                </div>
              </div>
            \`;
            
            seoHtml = \`<script type="application/ld+json">\${JSON.stringify(graphSchema)}</script>\${staticBody}\`;`
);
serverTs = serverTs.replace(
  /let finalHtml = template\.replace\('<!--seo-injection-->', typeof seoHtml !== 'undefined' \? seoHtml : ''\);/g,
  `let finalHtml = template.replace('<div id="root"></div>', \`<div id="root">\${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>\`);`
);
fs.writeFileSync('server.ts', serverTs);

console.log("Patches applied successfully.");
