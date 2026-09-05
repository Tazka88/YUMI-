const fs = require('fs');
let code = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

// Fix category seoIntro
code = code.replace(
  '<strong>${currentCategory.name.toLowerCase()} ${brand.name}</strong>',
  '<strong>{currentCategory.name.toLowerCase()} {brand.name}</strong>'
);
code = code.replace(
  'les produits de la gamme ${currentCategory.name.toLowerCase()} ${brand.name} répondront à vos besoins.',
  'les produits de la gamme {currentCategory.name.toLowerCase()} {brand.name} répondront à vos besoins.'
);
code = code.replace(
  'Profitez de la qualité ${brand.name} avec la garantie et le service Zorando.',
  'Profitez de la qualité {brand.name} avec la garantie et le service Zorando.'
);

// Fix brand seoIntro
code = code.replace(
  '<strong>${brand.name} Algérie</strong>',
  '<strong>{brand.name} Algérie</strong>'
);
code = code.replace(
  'd\'<strong>électroménager ${brand.name}</strong>',
  'd\'<strong>électroménager {brand.name}</strong>'
);
code = code.replace(
  '<strong>catégories d\'appareils ${brand.name}</strong>',
  '<strong>catégories d\'appareils {brand.name}</strong>'
);
code = code.replace(
  'vos produits ${brand.name} en toute sécurité',
  'vos produits {brand.name} en toute sécurité'
);

// We need to also check the categories grid
code = code.replace(
  '<h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories {brand.name}</h2>',
  '<h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories {brand.name}</h2>'
); // Was it $ ? Let's check. 

fs.writeFileSync('src/pages/BrandProducts.tsx', code);
