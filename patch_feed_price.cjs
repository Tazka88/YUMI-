const fs = require('fs');

// Patch src/api/routes.ts
let routesContent = fs.readFileSync('src/api/routes.ts', 'utf8');
routesContent = routesContent.replace(
/const priceVal = p\.promo_price > 0 \? p\.promo_price : p\.price;\s*const price = `\$\{Number\(priceVal\)\.toFixed\(2\)\} DZD`;/,
`const price = \`\${Number(p.price).toFixed(2)} DZD\`;
      const sale_price = p.promo_price > 0 ? \`\${Number(p.promo_price).toFixed(2)} DZD\` : null;`
);

routesContent = routesContent.replace(
/xml \+= `    <g:price>\$\{price\}<\/g:price>\\n`;/,
`xml += \`    <g:price>\${price}</g:price>\\n\`;
      if (sale_price) {
        xml += \`    <g:sale_price>\${sale_price}</g:sale_price>\\n\`;
      }`
);
fs.writeFileSync('src/api/routes.ts', routesContent);

// Patch api/index.ts
let apiContent = fs.readFileSync('api/index.ts', 'utf8');
apiContent = apiContent.replace(
/const displayPrice = product\.promo_price \|\| product\.price;/,
`const displayPrice = (product.promo_price && Number(product.promo_price) > 0) ? Number(product.promo_price).toFixed(2) : Number(product.price).toFixed(2);`
);
apiContent = apiContent.replace(
/"price": displayPrice\.toString\(\),/,
`"price": displayPrice.toString(),`
);
fs.writeFileSync('api/index.ts', apiContent);

console.log('Patched prices');
