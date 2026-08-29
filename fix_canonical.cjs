const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

// Replace:
// const host = req.get('host') || 'www.zorando.com';
// const baseUrl = `https://${host}`;
// With:
// const baseUrl = 'https://www.zorando.com';

code = code.replace(
  /const host = req\.get\('host'\) \|\| 'www\.zorando\.com';\n\s*const baseUrl = `https:\/\/\$\{host\}`;/g,
  "const baseUrl = 'https://www.zorando.com';"
);

fs.writeFileSync('api/index.ts', code);
console.log('Fixed canonical host');
