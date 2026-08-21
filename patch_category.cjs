const fs = require('fs');
let code = fs.readFileSync('src/pages/Category.tsx', 'utf8');

const target = "description={slug && categorySEOData[slug] ? categorySEOData[slug].description : `Découvrez notre sélection de produits dans la catégorie ${categoryName}. Achetez au meilleur prix sur ZORANDO.`}";
const replacement = "description={slug && categorySEOData[slug] ? categorySEOData[slug].description : `Découvrez notre sélection de produits dans la catégorie ${categoryName}. Achetez au meilleur prix sur ZORANDO.`}\n        keywords={slug && categorySEOData[slug]?.keywords ? categorySEOData[slug].keywords : undefined}";

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/Category.tsx', code);
  console.log("Category.tsx patched successfully");
} else {
  console.log("Could not find target string in Category.tsx");
}
