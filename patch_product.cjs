const fs = require('fs');
let content = fs.readFileSync('src/pages/Product.tsx', 'utf8');

const oldStr = `const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const finalSchema = [productSchema, breadcrumbSchema];

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <SEO 
        title={product.seo_title || product.name || 'Produit'} 
        description={product.seo_description || (product.description ? product.description.substring(0, 150) + '...' : 'Achetez ce produit au meilleur prix.')} 
        keywords={product.seo_keywords}
        image={(product.image && product.image.startsWith('/')) ? \`https://www.zorando.com\${product.image}\` : (product.image || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(product.name)}&background=random&size=800\`)}
        url={cleanUrl}
        type="product"
        schema={finalSchema}
      />
      {/* Breadcrumb */}`;

const newStr = `const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  // finalSchema is removed to avoid duplicating the schema rendered by the SSR

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <SEO 
        title={product.seo_title || product.name || 'Produit'} 
        description={product.seo_description || (product.description ? product.description.substring(0, 150) + '...' : 'Achetez ce produit au meilleur prix.')} 
        keywords={product.seo_keywords}
        image={(product.image && product.image.startsWith('/')) ? \`https://www.zorando.com\${product.image}\` : (product.image || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(product.name)}&background=random&size=800\`)}
        url={cleanUrl}
        type="product"
      />
      {/* Breadcrumb */}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/pages/Product.tsx', content);
console.log('Patched Product.tsx');
