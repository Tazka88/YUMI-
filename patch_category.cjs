const fs = require('fs');
const file = 'src/pages/Category.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `      <SEO 
        title={slug && categorySEOData[slug] ? categorySEOData[slug].title : categoryName} 
        exactTitle={!!(slug && categorySEOData[slug])}
        description={slug && categorySEOData[slug] ? categorySEOData[slug].description : \`Découvrez notre sélection de produits dans la catégorie \${categoryName}. Achetez au meilleur prix sur ZORANDO.\`} 
        url={window.location.href}
      />`;

const replacement = `      <SEO 
        title={slug && categorySEOData[slug] ? categorySEOData[slug].title : categoryName} 
        exactTitle={!!(slug && categorySEOData[slug])}
        description={slug && categorySEOData[slug] ? categorySEOData[slug].description : \`Découvrez notre sélection de produits dans la catégorie \${categoryName}. Achetez au meilleur prix sur ZORANDO.\`} 
        url={window.location.href}
        noindex={!!searchQuery || !!searchParams.get('ids')}
      />`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code);
    console.log("Category.tsx SEO patched successfully.");
} else {
    console.log("Could not find target in Category.tsx");
}
