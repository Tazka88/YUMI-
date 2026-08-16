const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  /<SEO\s+title="Boutique en ligne"\s+description="[^"]+"\s+url=\{window.location.href\}\s*\/>/,
  `<SEO 
        title="Boutique en Ligne Algérie : Achetez au Meilleur Prix" 
        exactTitle={false}
        description="Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Mode, tech, maison et plus à des prix imbattables. Livraison rapide. Commandez vite !" 
        url={window.location.href}
      />`
);

content = content.replace(
  /<h1 className="sr-only">\s*ZORANDO - Boutique en ligne en Algérie : Mode, Électroménager, Téléphonie, Beauté & Maison\s*<\/h1>/,
  `<h1 className="sr-only">
          Votre Shopping en Ligne de Confiance en Algérie
        </h1>`
);

fs.writeFileSync('src/pages/Home.tsx', content);
