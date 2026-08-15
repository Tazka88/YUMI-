const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove canonical from headHtml initially
code = code.replace(
  "let headHtml = `<link rel=\"canonical\" href=\"${baseUrl}${reqCanonicalPath}\" />`;",
  "let headHtml = `<link rel=\"canonical\" href=\"${baseUrl}${reqCanonicalPath}\" id=\"ssr-canonical\" />`;"
);

// 2. We'll manually replace the seoHtml sections for all pages.
fs.writeFileSync('server.ts', code);
