const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

code = code.replace(
  /encodeURIComponent\(window\.location\.href\)/g,
  "encodeURIComponent(cleanUrl)"
);

fs.writeFileSync('src/pages/Product.tsx', code);
