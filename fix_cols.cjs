const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

code = code.replace(
  /const PRODUCT_COLS = `p\.id, /g,
  'const PRODUCT_COLS = `p.id, p.sku, '
);

code = code.replace(
  /const PRODUCT_LIST_COLS = `p\.id, /g,
  'const PRODUCT_LIST_COLS = `p.id, p.sku, '
);

code = code.replace(
  /const META_PRODUCT_COLS = `p\.id, /g,
  'const META_PRODUCT_COLS = `p.id, p.sku, '
);

fs.writeFileSync('src/api/routes.ts', code);
