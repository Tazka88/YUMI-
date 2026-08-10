const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

code = code.replace(
  'p.promo_price, p.stock,',
  'p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.stock,'
);

code = code.replace(
  'p.price, p.promo_price, p.is_active',
  'p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.is_active'
);

code = code.replace(
  'p.price, p.promo_price, p.stock, p.is_fast_delivery,',
  'p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.stock, p.is_fast_delivery,'
);

fs.writeFileSync('src/api/routes.ts', code);
