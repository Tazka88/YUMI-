const fs = require('fs');

let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

// I will extract everything up to `} else {` and just replace the bottom.
const splitString = `        <p>
          Découvrez notre sélection de produits <strong>{brand.name} Algérie</strong> sur Zorando. 
          Nous proposons une gamme complète de <strong>produits {brand.name}</strong>, 
          reconnus pour leur qualité et leur fiabilité. 
          Parcourez ci-dessous toutes les <strong>catégories {brand.name}</strong> disponibles 
          pour faciliter votre quotidien. Achetez en ligne vos produits {brand.name} en toute sécurité en Algérie.
        </p>
      </div>
    );
  }`;

const parts = content.split(splitString);
if (parts.length === 2) {
    const newBottom = `
  let schemaData = [];
  if (brand.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires') {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.zorando.com/" },
        { "@type": "ListItem", "position": 2, "name": "Marques", "item": "https://www.zorando.com/brands" },
        { "@type": "ListItem", "position": 3, "name": "Moulinex", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie" },
        { "@type": "ListItem", "position": 4, "name": "Bouilloires", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie/bouilloires" }
      ]
    };
    
    const productSchemas = displayedProducts.map(p => ({
      "@type": "Product",
      "name": p.name,
      "image": p.image ? (p.image.startsWith('/') ? \`https://www.zorando.com\${p.image}\` : p.image) : undefined,
      "brand": { "@type": "Brand", "name": "Moulinex" },
      "sku": p.sku || undefined,
      "offers": {
        "@type": "Offer",
        "url": \`https://www.zorando.com/product/\${p.slug}\`,
        "priceCurrency": "DZD",
        "price": p.promo_price || p.price,
        "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    }));
    
    schemaData = [breadcrumbSchema, ...productSchemas];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
        schema={schemaData.length > 0 ? schemaData : undefined}
      />
      
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <ChevronRight size={14} />
        <Link to="/brands" className="hover:text-orange-500">Marques</Link>
        <ChevronRight size={14} />
        {isCategoryPage ? (
          <>
            <Link to={\`/brands/\${brand.slug}\`} className="hover:text-orange-500">{brand.name}</Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{currentCategory.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">{brand.name}</span>
        )}
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {brand.image ? (
          <Link to={\`/brands/\${brand.slug}\`} className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 hover:border-orange-200 transition-colors">
            <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-[15px]" />
          </Link>
        ) : (
          <Link to={\`/brands/\${brand.slug}\`} className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 p-[15px] hover:border-orange-200 transition-colors">
            <span className="text-4xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
          </Link>
        )}
        
        <div className="text-left flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{h1Title}</h1>
          
          {/* SEO Natural Text */}
          {seoIntro}

          <div className="mt-2 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
            {displayedProducts.length} produit{displayedProducts.length !== 1 ? 's' : ''} {isCategoryPage ? 'dans cette catégorie' : 'au total'}
          </div>
        </div>
      </div>

      {/* Dynamic Brand Categories Section (Only on main brand page) */}
      {!isCategoryPage && brandCategories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories {brand.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandCategories.map(cat => (
              <div key={\`\${cat.level}-\${cat.id}\`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{cat.name} {brand.name} Algérie</h3>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  Découvrez la gamme de {cat.name.toLowerCase()} {brand.name} disponible en Algérie.
                </p>
                <Link 
                  to={\`/brands/\${brand.slug}/\${cat.slug}\`}
                  className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Voir les {cat.name.toLowerCase()} {brand.name}
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Area */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isCategoryPage ? \`Tous les produits \${currentCategory.name} \${brand.name}\` : \`Tous les produits \${brand.name}\`}
            </h2>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 mb-6">Il n'y a pas de produits disponibles dans cette catégorie pour le moment.</p>
              <Link to={\`/brands/\${brand.slug}\`} className="text-orange-500 hover:text-orange-600 font-medium">
                Voir tous les produits {brand.name}
              </Link>
            </div>
          )}
        </div>

        {/* Existing SEO Sidebar Content (fallback if brand has custom HTML) */}
        {!isCategoryPage && brand.seo_content && (
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
}
`;
    fs.writeFileSync('src/pages/BrandProducts.tsx', parts[0] + splitString + newBottom);
    console.log('Fixed syntax by replacing the whole bottom of the file.');
} else {
    console.log('Could not find split string');
}

