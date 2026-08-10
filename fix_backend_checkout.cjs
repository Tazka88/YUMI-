const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

code = code.replace(
  'SELECT price, promo_price, stock, variations FROM products WHERE id = ${item.product_id}',
  'SELECT price, promo_price, promo_price_start_date, promo_price_end_date, stock, variations FROM products WHERE id = ${item.product_id}'
);

code = code.replace(
  'let actualPrice = product.promo_price || product.price;',
  `let isPromoValid = (() => {
        if (!product.promo_price) return false;
        const now = new Date();
        if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
        if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
        return true;
      })();
      let actualPrice = isPromoValid ? product.promo_price : product.price;`
);

fs.writeFileSync('src/api/routes.ts', code);
