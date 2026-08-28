const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');
const searchString = 'seoHtml = `<script type="application/ld+json">${JSON.stringify(graphSchema)}</script>`;';
const replaceString = `
            headHtml += \`<meta property="og:type" content="product" />\\n\`;
            headHtml += \`<meta name="twitter:card" content="summary_large_image" />\\n\`;
            headHtml += \`<meta property="product:price:amount" content="\${displayPrice}" />\\n\`;
            headHtml += \`<meta property="product:price:currency" content="DZD" />\\n\`;
            
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
            
            seoHtml = \`<script type="application/ld+json">\${JSON.stringify(graphSchema)}</script>\\n\${staticBody}\`;`;

serverTs = serverTs.replace(searchString, replaceString);
serverTs = serverTs.replace(
  "let finalHtml = template.replace('<!--seo-injection-->', typeof seoHtml !== 'undefined' ? seoHtml : '');",
  "let finalHtml = template.replace('<div id=\"root\"></div>', `<div id=\"root\">${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>`);"
);
fs.writeFileSync('server.ts', serverTs);
console.log("Server.ts patched successfully.");
