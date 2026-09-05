const fs = require('fs');
let code = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

// Ligne 117
code = code.replace(
  'pageTitle = `${currentCategory.name} ${brand.name} Algérie – ${currentCategory.name} et appareils | Zorando`;',
  'pageTitle = `${currentCategory.name} ${brand.name} Algérie – ${currentCategory.name} au meilleur prix | Zorando`;'
);

// Ligne 131
code = code.replace(
  'h1Title = brand.h1_title || `${brand.name} Algérie – Électroménager et appareils ${brand.name}`;',
  'h1Title = brand.h1_title || `${brand.name} Algérie – Tous les produits ${brand.name}`;'
);

// Ligne 132
code = code.replace(
  'pageTitle = brand.seo_title || `${brand.name} Algérie – Produits et Électroménager | Zorando`;',
  'pageTitle = brand.seo_title || `${brand.name} Algérie – Catalogue de produits | Zorando`;'
);

// Ligne 133
code = code.replace(
  'metaDescription = brand.seo_description || brand.description || `Découvrez tous les produits de la marque ${brand.name} disponibles en Algérie sur Zorando. Électroménager, appareils et bien plus au meilleur prix.`;',
  'metaDescription = brand.seo_description || brand.description || `Découvrez tous les produits de la marque ${brand.name} disponibles en Algérie sur Zorando. Le meilleur catalogue au meilleur prix.`;'
);

// Ligne 139
code = code.replace(
  'Nous proposons une large gamme de produits et d\'<strong>électroménager {brand.name}</strong>,',
  'Nous proposons une gamme complète de <strong>produits {brand.name}</strong>,'
);

// Ligne 141
code = code.replace(
  'Découvrez ci-dessous toutes les <strong>catégories d\'appareils {brand.name}</strong> disponibles',
  'Parcourez ci-dessous toutes les <strong>catégories {brand.name}</strong> disponibles'
);

// Ligne 208
code = code.replace(
  'Découvrez les {cat.name.toLowerCase()} et appareils {brand.name} disponibles en Algérie.',
  'Découvrez la gamme de {cat.name.toLowerCase()} {brand.name} disponible en Algérie.'
);

fs.writeFileSync('src/pages/BrandProducts.tsx', code);
console.log('Fix applied.');
