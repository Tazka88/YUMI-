const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(
  "SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock,",
  "SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, p.is_active,"
);

code = code.replace(
  "if (product) {\n          title = product.seo_title || `${product.name} | Zorando`;",
  "if (product) {\n          if (product.is_active === false) {\n            const redirectUrl = product.category_slug ? `/category/${product.category_slug}` : '/';\n            res.redirect(301, redirectUrl);\n            return;\n          }\n          title = product.seo_title || `${product.name} | Zorando`;"
);
fs.writeFileSync('api/index.ts', code);
console.log('Patched api/index.ts');
