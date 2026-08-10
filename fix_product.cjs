const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

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

code = code.replace(
  'const currentPrice = (product.promo_price !== null && product.promo_price !== undefined) ? Number(product.promo_price) : Number(product.price);',
  `const isPromoValid = (() => {
        if (product.promo_price === null || product.promo_price === undefined) return false;
        const now = new Date();
        if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
        if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
        return true;
      })();
      const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);`
);

code = code.replace(
  `"priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],`,
  `"priceValidUntil": (isPromo && product.promo_price_end_date) ? new Date(product.promo_price_end_date).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],`
);

fs.writeFileSync('src/pages/Product.tsx', code);
