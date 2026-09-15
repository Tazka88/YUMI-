const fs = require('fs');

let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

const targetSEO = `<SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
      />`;

const newTargetSEO = `
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
      />`;

if (content.includes(targetSEO)) {
    content = content.replace(targetSEO, newTargetSEO);
}

// Ensure the return block doesn't output double <SEO ...
content = content.replace(`  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
      />`, newTargetSEO);


fs.writeFileSync('src/pages/BrandProducts.tsx', content);
console.log('Added structured data logic');
