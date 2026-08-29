const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace:
//           const slug = req.path.split('/')[2];
//           
//           // FAST PATH: Use static SEO data first without querying the DB
//           if (categorySEOData && categorySEOData[slug]) {

code = code.replace(
  "const slug = req.path.split('/')[2];\n          \n          // FAST PATH: Use static SEO data first without querying the DB\n          if (categorySEOData && categorySEOData[slug]) {",
  `const slug = req.path.split('/')[2];\n          \n          if (slug === 'all') {\n            title = 'Tous les produits | ZORANDO';\n            description = 'Découvrez tous nos produits sur ZORANDO. Nouveautés, ventes flash et meilleures ventes. Achetez au meilleur prix.';\n            seoHtml = '';\n          } else if (categorySEOData && categorySEOData[slug]) {`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed category all in server.ts');
