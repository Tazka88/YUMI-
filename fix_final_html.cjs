const fs = require('fs');

let apiIndex = fs.readFileSync('api/index.ts', 'utf-8');

// Replace the seo-injection line to also inject seoHtml into <div id="root">
apiIndex = apiIndex.replace(
  "let finalHtml = template.replace('<!--seo-injection-->', globalNav + (seoHtml || ''));",
  `let finalHtml = template.replace('<!--seo-injection-->', globalNav);
    finalHtml = finalHtml.replace('<div id="root"></div>', \`<div id="root">\${seoHtml || ''}</div>\`);`
);

fs.writeFileSync('api/index.ts', apiIndex);
console.log("api/index.ts fixed.");
