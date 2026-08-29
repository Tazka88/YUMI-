const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf8');

  const oldDescLine = "description = product.seo_description ? cleanForSEO(product.seo_description) : (product.description ? cleanForSEO(product.description, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);";
  
  const newDescLine = `if (product.seo_description) {
            description = cleanForSEO(product.seo_description);
          } else if (product.description) {
            const shortDesc = cleanForSEO(product.description, 80);
            description = \`Découvrez \${product.name} sur Zorando. \${shortDesc} Commandez vite au meilleur prix !\`;
            if (description.length > 160) {
              description = \`Découvrez \${product.name} sur Zorando. Commandez vite au meilleur prix !\`;
            }
          } else {
            description = \`Achetez \${product.name} au meilleur prix sur ZORANDO.\`;
          }`;
          
  if (code.includes(oldDescLine)) {
    code = code.replace(oldDescLine, newDescLine);
    fs.writeFileSync(file, code);
    console.log(`Updated auto meta generation in ${file}`);
  }
}
