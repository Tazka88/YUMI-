const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "console.error('SEO Injection Error:', err);",
  "console.error('SEO Injection Error:', err); fs.appendFileSync('seo_error.log', err.stack + '\\n');"
);
fs.writeFileSync('server.ts', code);
