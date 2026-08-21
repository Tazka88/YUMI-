const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
            seoHtml = '';`;

const replacement = `const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
            seoHtml = \`<script type="application/ld+json" data-rh="true">\${JSON.stringify(graphSchema)}</script>\`;`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("server.ts product jsonld restored.");
}
