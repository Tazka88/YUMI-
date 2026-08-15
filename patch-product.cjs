const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf-8');

// The original line:
// "priceValidUntil": (isPromo && product.promo_price_end_date) ? new Date(product.promo_price_end_date).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],

code = code.replace(
  /\"priceValidUntil\":\s*\(isPromo && product\.promo_price_end_date\) \? new Date\(product\.promo_price_end_date\)\.toISOString\(\)\.split\('T'\)\[0\] : new Date\(new Date\(\)\.setFullYear\(new Date\(\)\.getFullYear\(\) \+ 1\)\)\.toISOString\(\)\.split\('T'\)\[0\],/g,
  `...(isPromo && product.promo_price_end_date ? { "priceValidUntil": new Date(product.promo_price_end_date).toISOString().split('T')[0] } : {}),`
);

fs.writeFileSync('src/pages/Product.tsx', code);
