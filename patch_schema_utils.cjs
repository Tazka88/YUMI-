const fs = require('fs');
let content = fs.readFileSync('src/lib/schemaUtils.ts', 'utf8');

content = content.replace(
/const currentPrice = isPromo \? Number\(product\.promo_price\) : Number\(product\.price\);/,
`const currentPrice = isPromo ? Number(product.promo_price).toFixed(2) : Number(product.price).toFixed(2);`
);

fs.writeFileSync('src/lib/schemaUtils.ts', content);
console.log('Patched schemaUtils.ts');
