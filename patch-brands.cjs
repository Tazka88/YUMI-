const fs = require('fs');

let content = fs.readFileSync('src/pages/Brands.tsx', 'utf8');

content = content.replace(
  /<SEO\s+title="Toutes les marques"\s+description="[^"]+"\s*\/>/,
  `<SEO 
        title="Nos Marques Partenaires : Qualité et Choix Garantis" 
        exactTitle={false}
        description="Parcourez toutes les grandes marques disponibles sur ZORANDO. Des produits authentiques et certifiés dans toutes les catégories. Achetez vos marques préférées !"
      />`
);

content = content.replace(
  /<h1 className="text-3xl font-bold text-gray-900 mb-4">Toutes les marques<\/h1>/,
  `<h1 className="text-3xl font-bold text-gray-900 mb-4">L'Excellence de nos Marques Partenaires</h1>`
);

fs.writeFileSync('src/pages/Brands.tsx', content);
