const fs = require('fs');

let routesContent = fs.readFileSync('src/api/routes.ts', 'utf8');

// For merchant-feed.xml
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

console.log('Patched prices properly');
