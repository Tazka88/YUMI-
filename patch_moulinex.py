import re

with open('src/pages/BrandProducts.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the block around line 116
moulinex_react_block = """
  let bottomSeoContent = null;
  if (brand.slug === 'electromenager-moulinex-algerie' && currentCategory) {
    const catName = currentCategory.name;
    h1Title = `${catName} Moulinex en Algérie`;
    pageTitle = `${catName} Moulinex en Algérie | Prix & Achat | ZORANDO`;
    metaDescription = `Découvrez la gamme de ${catName.toLowerCase()} Moulinex disponibles chez ZORANDO. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.`;
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6 space-y-4">
        <p>Vous recherchez un(e) {catName.toLowerCase()} Moulinex en Algérie ? ZORANDO vous propose une sélection de {catName.toLowerCase()} électriques Moulinex adaptées à différents besoins et budgets. Retrouvez des modèles variés et performants selon vos attentes.</p>
        <p>Comparez facilement les {catName.toLowerCase()} Moulinex disponibles : capacité, puissance, fonctionnalités et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
        <p>Commandez votre {catName.toLowerCase()} Moulinex en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
      </div>
    );
    bottomSeoContent = (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Quel(le) {catName.toLowerCase()} Moulinex choisir ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Le choix dépend avant tout de votre utilisation quotidienne. Pour une utilisation familiale, une grande capacité sera idéale. Si vous avez peu de place ou une utilisation individuelle, des capacités plus réduites sont très pratiques.</p>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Les {catName.toLowerCase()} Moulinex disponibles chez ZORANDO</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre capacité, puissance, et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle. Vous pouvez consulter nos <Link to="/brands/electromenager-moulinex-algerie" className="text-orange-500 font-medium hover:underline">autres produits Moulinex</Link> pour équiper votre cuisine.</p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">FAQ – {catName} Moulinex</h2>
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold text-gray-800">Quel(le) {catName.toLowerCase()} Moulinex choisir pour une famille ?</h3>
            <p className="text-gray-700 text-sm mt-1">Pour une utilisation familiale, un(e) {catName.toLowerCase()} Moulinex de grande capacité offre une solution adaptée pour répondre aux besoins de plusieurs personnes.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quel est le prix d'un(e) {catName.toLowerCase()} Moulinex en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Le prix dépend du modèle, de sa capacité, de sa puissance et de ses fonctionnalités. ZORANDO affiche le prix actuel directement sur chaque fiche produit afin de permettre de comparer les modèles Moulinex disponibles.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Les {catName.toLowerCase()} Moulinex sont-ils/elles disponibles avec livraison en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Oui. Les {catName.toLowerCase()} Moulinex disponibles sur ZORANDO peuvent être commandées en ligne avec livraison dans les 58 wilayas d'Algérie et paiement à la livraison, selon les conditions affichées sur la fiche du produit.</p>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Pourquoi acheter un(e) {catName.toLowerCase()} Moulinex chez ZORANDO ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>ZORANDO vous permet de comparer plusieurs modèles de {catName.toLowerCase()} Moulinex selon leur capacité, leur puissance, leur design et leurs fonctionnalités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
        </div>
      </div>
    );
"""

pattern1 = r"let bottomSeoContent = null;\s+if \(brand\.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires'\) \{[\s\S]*?</div>\s+\);\s+\}"
code = re.sub(pattern1, moulinex_react_block.strip(), code, flags=re.MULTILINE)

# Schema replacement
moulinex_schema_block = """
  let schemaData = [];
  if (brand.slug === 'electromenager-moulinex-algerie' && currentCategory) {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.zorando.com/" },
        { "@type": "ListItem", "position": 2, "name": "Marques", "item": "https://www.zorando.com/brands" },
        { "@type": "ListItem", "position": 3, "name": "Moulinex", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie" },
        { "@type": "ListItem", "position": 4, "name": currentCategory.name, "item": `https://www.zorando.com/brands/electromenager-moulinex-algerie/${categorySlug}` }
      ]
    };
    
    const productSchemas = displayedProducts.map(p => ({
      "@type": "Product",
      "name": p.name,
      "image": p.image ? (p.image.startsWith('/') ? `https://www.zorando.com${p.image}` : p.image) : undefined,
      "brand": { "@type": "Brand", "name": "Moulinex" },
"""

pattern2 = r"let schemaData = \[\];\s+if \(brand\.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires'\) \{[\s\S]*?\"brand\": \{ \"@type\": \"Brand\", \"name\": \"Moulinex\" \},"
code = re.sub(pattern2, moulinex_schema_block.strip(), code, flags=re.MULTILINE)

with open('src/pages/BrandProducts.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
