const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(
  /description = product\.seo_description \? cleanForSEO\(product\.seo_description\) : \(product\.description \? cleanForSEO\(product\.description, 160\) : \`Achetez \$\{product\.name\} au meilleur prix sur ZORANDO\.\`\);/g,
  "description = product.seo_description ? cleanForSEO(product.seo_description) : (product.description ? cleanForSEO(product.description, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);\n          if (product.seo_keywords) keywords = product.seo_keywords;"
);
fs.writeFileSync('api/index.ts', code);
console.log('patched api index');
