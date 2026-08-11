const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

code = code.replace(
  "const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';",
  "const currentOrigin = 'https://www.zorando.com';"
);
code = code.replace(
  "const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';",
  "const currentOrigin = 'https://www.zorando.com';"
);

fs.writeFileSync('src/pages/Product.tsx', code);
