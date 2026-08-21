const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  /if \(product\.seo_keywords\) \{\s*headHtml \+= \`<meta name="keywords" content="\$\{product\.seo_keywords\}" \/>\`;\s*\}/g,
  "if (product.seo_keywords) { keywords = product.seo_keywords; }"
);
fs.writeFileSync('server.ts', code);
console.log('patched server keywords');
