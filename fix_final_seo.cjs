const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf-8');

  // Replace style
  code = code.replace(
    '<div style="display:none;" id="seo-static-content">',
    '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content">'
  );

  // Replace description with long description + h2
  code = code.replace(
    '<div>${description}</div>',
    `<div>
                <h2>Description</h2>
                <div>\${(product.description || description || '').replace(/\\n/g, '<br />')}</div>
              </div>`
  );

  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
}
