const fs = require('fs');
let code = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');

code = code.replace(
  'const isPromo = product.promo_price !== null;',
  `const isPromo = (() => {
    if (product.promo_price === null) return false;
    const now = new Date();
    if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
    if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
    return true;
  })();`
);

fs.writeFileSync('src/components/ProductCard.tsx', code);
