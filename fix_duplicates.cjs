const fs = require('fs');
let routesContent = fs.readFileSync('src/api/routes.ts', 'utf8');

routesContent = routesContent.replace(
/      if \(sale_price\) \{\s*xml \+= `    <g:sale_price>\$\{sale_price\}<\/g:sale_price>\\n`;\s*\}\s*if \(sale_price\) \{\s*xml \+= `    <g:sale_price>\$\{sale_price\}<\/g:sale_price>\\n`;\s*\}/g,
`      if (sale_price) {
        xml += \`    <g:sale_price>\${sale_price}</g:sale_price>\\n\`;
      }`
);

fs.writeFileSync('src/api/routes.ts', routesContent);
console.log('Fixed duplicates');
