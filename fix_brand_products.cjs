const fs = require('fs');
let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

content = content.replace(
  "if (brand.slug === 'electromenager-moulinex-algerie' && currentCategory) {",
  "if (currentCategory) {"
);

content = content.replace(
  /h1Title = `\$\{catName\} Moulinex en Algérie`;/g,
  "h1Title = `${catName} ${brand.name} en Algérie`;"
);

content = content.replace(
  /pageTitle = `\$\{catName\} Moulinex en Algérie \| Prix & Achat \| ZORANDO`;/g,
  "pageTitle = `${catName} ${brand.name} en Algérie | Prix & Achat | ZORANDO`;"
);

content = content.replace(
  /metaDescription = `Découvrez la gamme de \$\{catName\.toLowerCase\(\)\} Moulinex disponibles chez ZORANDO\. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison\.`;/g,
  "metaDescription = `Découvrez la gamme de ${catName.toLowerCase()} ${brand.name} disponibles chez ZORANDO. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.`;"
);

content = content.replace(/Moulinex/g, "${brand.name}");

// Fix the "électriques ${brand.name}" 
content = content.replace(/électriques \$\{brand\.name\}/g, "${brand.name}");

content = content.replace(
  `{ "@type": "ListItem", "position": 3, "name": "\${brand.name}", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie" }`,
  `{ "@type": "ListItem", "position": 3, "name": brand.name, "item": \`https://www.zorando.com/brands/\${brand.slug}\` }`
);

content = content.replace(
  `"item": \`https://www.zorando.com/brands/electromenager-moulinex-algerie/\${categorySlug}\``,
  `"item": \`https://www.zorando.com/brands/\${brand.slug}/\${categorySlug}\``
);

content = content.replace(
  `"brand": { "@type": "Brand", "name": "\${brand.name}" }`,
  `"brand": { "@type": "Brand", "name": brand.name }`
);

content = content.replace(
  `} else if (isCategoryPage) {`,
  `} else if (false) {` // Disable the fallback since currentCategory takes precedence
);

fs.writeFileSync('src/pages/BrandProducts.tsx', content);
