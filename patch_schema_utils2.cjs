const fs = require('fs');
let code = fs.readFileSync('src/lib/schemaUtils.ts', 'utf8');

code = code.replace(
  /const isPromo = product\.promo_price && Number\(product\.promo_price\) < Number\(product\.price\);/,
  `const isPromo = product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);`
);

code = code.replace(
  /const currentPrice = isPromo \? Number\(product\.promo_price\)\.toFixed\(2\) : Number\(product\.price\)\.toFixed\(2\);/,
  `const currentPrice = isPromo ? Number(product.promo_price).toFixed(2) : (!isNaN(Number(product.price)) ? Number(product.price).toFixed(2) : "0.00");`
);

code = code.replace(
  /let avgRating = Number\(product\.avg_rating \|\| 0\);/,
  `let avgRating = Number(product.avg_rating || 0);\n    if (avgRating < 1 && reviewCount > 0) avgRating = 5;`
);

fs.writeFileSync('src/lib/schemaUtils.ts', code);
console.log("schemaUtils.ts patched.");
