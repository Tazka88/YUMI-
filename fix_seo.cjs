const fs = require('fs');

// Fix BrandProducts.tsx
let brandProductsCode = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');
brandProductsCode = brandProductsCode.replace(
  'Bienvenue sur la boutique officielle <strong>{brand.name} Algérie</strong> sur Zorando.',
  'Découvrez notre sélection de produits <strong>{brand.name} Algérie</strong> sur Zorando.'
);
fs.writeFileSync('src/pages/BrandProducts.tsx', brandProductsCode);

// Fix Brands.tsx
let brandsCode = fs.readFileSync('src/pages/Brands.tsx', 'utf8');
brandsCode = brandsCode.replace(
  'title="Nos Marques Partenaires : Qualité et Choix Garantis"',
  'title="Toutes nos marques : Qualité et Choix Garantis"'
);
brandsCode = brandsCode.replace(
  'Revenez plus tard pour découvrir nos marques partenaires.',
  'Revenez plus tard pour découvrir nos nouvelles marques.'
);
fs.writeFileSync('src/pages/Brands.tsx', brandsCode);

console.log("Replacements done");
