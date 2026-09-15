const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace("const categorySlug = parts[3];", "const categorySlug = parts[3]; console.log('SSR BRAND ROUTE:', slug, categorySlug);");
fs.writeFileSync('server.ts', content);
