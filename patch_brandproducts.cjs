const fs = require('fs');

let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

const target1 = `  if (isCategoryPage) {
    h1Title = \`\${currentCategory.name} \${brand.name} Algérie\`;
    pageTitle = \`\${currentCategory.name} \${brand.name} Algérie – \${currentCategory.name} au meilleur prix | Zorando\`;
    metaDescription = \`Découvrez les \${currentCategory.name.toLowerCase()} \${brand.name} disponibles en Algérie sur Zorando. Consultez les modèles, caractéristiques et prix des \${currentCategory.name.toLowerCase()} \${brand.name}.\`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de <strong>{currentCategory.name.toLowerCase()} {brand.name}</strong> en Algérie. 
          Que vous cherchiez la performance, la durabilité ou le meilleur rapport qualité-prix, 
          les produits de la gamme {currentCategory.name.toLowerCase()} {brand.name} répondront à vos besoins. 
          Profitez de la qualité {brand.name} avec la garantie et le service Zorando.
        </p>
      </div>
    );
  } else {`;

const newTarget1 = `  let bottomSeoContent = null;
  if (brand.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires') {
    h1Title = "☕ Bouilloires Moulinex en Algérie";
    pageTitle = "🍳 Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO";
    metaDescription = "Découvrez les bouilloires Moulinex disponibles chez ZORANDO : 0,8 L, 1,2 L, 1,7 L, 2000 W, 2400 W et plus. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.";
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6 space-y-4">
        <p>Vous recherchez une bouilloire Moulinex en Algérie pour préparer rapidement votre thé, café ou infusion ? ZORANDO vous propose une sélection de bouilloires électriques Moulinex adaptées à différents besoins et budgets. Retrouvez des modèles compacts de 0,8 L, des capacités de 1,2 L et des bouilloires familiales de 1,7 L, avec différentes puissances comme 2000 W et 2400 W selon les modèles.</p>
        <p>Comparez facilement les bouilloires Moulinex disponibles : capacité, puissance, matière, filtre anticalcaire, socle 360°, arrêt automatique et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
        <p>Commandez votre bouilloire Moulinex en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
      </div>
    );
    bottomSeoContent = (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Quelle bouilloire Moulinex choisir ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Le choix dépend avant tout de votre utilisation quotidienne. Pour une utilisation familiale, une grande capacité de 1,7 L sera idéale. Si vous avez peu de place ou une utilisation individuelle, les capacités de 0,8 L ou 1,2 L sont très pratiques. Les puissances varient généralement entre 2000 W et 2400 W : une puissance plus élevée permettra à l'eau de bouillir plus vite.</p>
          <p>La majorité de ces modèles sont sans fil sur socle 360°, et certains bénéficient d'une finition inox élégante ou intègrent un filtre anticalcaire amovible pour faciliter l'entretien.</p>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Les bouilloires Moulinex disponibles chez ZORANDO</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre capacité, puissance, et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle. Vous pouvez consulter nos <Link to="/brands/electromenager-moulinex-algerie" className="text-orange-500 font-medium hover:underline">autres produits Moulinex</Link> pour équiper votre cuisine.</p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">FAQ – Bouilloires Moulinex</h2>
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold text-gray-800">Quelle bouilloire Moulinex choisir pour une famille ?</h3>
            <p className="text-gray-700 text-sm mt-1">Pour une utilisation familiale, une bouilloire Moulinex de 1,7 L offre une capacité adaptée pour chauffer davantage d'eau en une seule fois. Le choix final dépend toutefois des besoins et des caractéristiques du modèle disponible.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quel est le prix d'une bouilloire Moulinex en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Le prix dépend du modèle, de sa capacité, de sa puissance et de ses fonctionnalités. ZORANDO affiche le prix actuel directement sur chaque fiche produit afin de permettre de comparer les modèles Moulinex disponibles.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quelle capacité choisir pour une bouilloire Moulinex ?</h3>
            <p className="text-gray-700 text-sm mt-1">Une capacité de 0,8 L convient notamment pour une utilisation individuelle ou lorsque peu d'eau est nécessaire. Une capacité de 1,2 L offre un compromis entre encombrement et quantité d'eau, tandis qu'une bouilloire de 1,7 L convient davantage lorsque plusieurs tasses doivent être préparées.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Les bouilloires Moulinex sont-elles disponibles avec livraison en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Oui. Les bouilloires Moulinex disponibles sur ZORANDO peuvent être commandées en ligne avec livraison dans les 58 wilayas d'Algérie et paiement à la livraison, selon les conditions affichées sur la fiche du produit.</p>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Pourquoi acheter une bouilloire Moulinex chez ZORANDO ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>ZORANDO vous permet de comparer plusieurs modèles de bouilloires Moulinex selon leur capacité, leur puissance, leur design et leurs fonctionnalités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
        </div>
      </div>
    );
  } else if (isCategoryPage) {
    h1Title = \`\${currentCategory.name} \${brand.name} Algérie\`;
    pageTitle = \`\${currentCategory.name} \${brand.name} Algérie – \${currentCategory.name} au meilleur prix | Zorando\`;
    metaDescription = \`Découvrez les \${currentCategory.name.toLowerCase()} \${brand.name} disponibles en Algérie sur Zorando. Consultez les modèles, caractéristiques et prix des \${currentCategory.name.toLowerCase()} \${brand.name}.\`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de <strong>{currentCategory.name.toLowerCase()} {brand.name}</strong> en Algérie. 
          Que vous cherchiez la performance, la durabilité ou le meilleur rapport qualité-prix, 
          les produits de la gamme {currentCategory.name.toLowerCase()} {brand.name} répondront à vos besoins. 
          Profitez de la qualité {brand.name} avec la garantie et le service Zorando.
        </p>
      </div>
    );
  } else {`;

if (content.includes(target1)) {
    content = content.replace(target1, newTarget1);
}

const target2 = `        {!isCategoryPage && brand.seo_content && (
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 seo-description sticky top-24">
              <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;

const newTarget2 = `        {!isCategoryPage && brand.seo_content && (
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 seo-description sticky top-24">
              <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
            </div>
          </div>
        )}
      </div>
      {bottomSeoContent}
    </div>
  );
}`;

if (content.includes(target2)) {
    content = content.replace(target2, newTarget2);
}

fs.writeFileSync('src/pages/BrandProducts.tsx', content);
console.log('BrandProducts patched.');
