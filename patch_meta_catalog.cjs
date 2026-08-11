const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

code = code.replace(
  "const baseUrl = req.protocol + '://' + req.get('host');",
  "const baseUrl = 'https://www.zorando.com';"
);

fs.writeFileSync('src/api/routes.ts', code);
