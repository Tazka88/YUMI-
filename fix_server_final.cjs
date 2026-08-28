const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

serverTs = serverTs.replace(
  "let finalHtml = template.replace('<div id=\"root\"></div>', `<div id=\"root\">${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>`);",
  `let finalHtml = template.replace('<!--seo-injection-->', '');
        finalHtml = finalHtml.replace('<div id="root"></div>', \`<div id="root">\${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>\`);`
);

fs.writeFileSync('server.ts', serverTs);
console.log("Server.ts final html fixed.");
