const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  const startRegex = /\} else if \(req\.path\.startsWith\('\/category\/'\)\) \{/;
  const startMatch = code.match(startRegex);
  if (!startMatch) {
    console.log("Could not find start match in " + filepath);
    return;
  }
  
  const endRegex = /\} else if \(req\.path\.startsWith\('\/product\/'\)\) \{/;
  const endMatch = code.match(endRegex);
  if (!endMatch) {
    console.log("Could not find end match in " + filepath);
    return;
  }
  
  const startIndex = startMatch.index;
  const endIndex = endMatch.index;
  
  const newBlock = `} else if (req.path.startsWith('/category/')) {
          const slug = req.path.split('/')[2];
          
          // FAST PATH: Use static SEO data first without querying the DB
          if (categorySEOData && categorySEOData[slug]) {
            title = categorySEOData[slug].title;
            description = categorySEOData[slug].description;
            if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;
            seoHtml = ''; // No hidden content
          } else {
            try {
              const [category] = await sql\`SELECT id, name FROM categories WHERE slug = \${slug}\`;
              if (category) {
                title = \`\${category.name} | ZORANDO\`;
                description = \`Découvrez notre sélection de produits dans la catégorie \${category.name}. Achetez au meilleur prix sur ZORANDO.\`;
                seoHtml = '';
              } else {
                const [subcat] = await sql\`SELECT id, name FROM subcategories WHERE slug = \${slug}\`;
                if (subcat) {
                  title = \`\${subcat.name} | ZORANDO\`;
                  description = \`Découvrez notre sélection de produits dans la catégorie \${subcat.name}. Achetez au meilleur prix sur ZORANDO.\`;
                  seoHtml = '';
                } else {
                  const [subSubcat] = await sql\`SELECT id, name FROM sub_subcategories WHERE slug = \${slug}\`;
                  if (subSubcat) {
                    title = \`\${subSubcat.name} | ZORANDO\`;
                    description = \`Découvrez notre sélection de produits dans la catégorie \${subSubcat.name}. Achetez au meilleur prix sur ZORANDO.\`;
                    seoHtml = '';
                  } else {
                    isNotFound = true;
                  }
                }
              }
            } catch (err) {
              console.error("DB error for category fallback:", err);
            }
          }
        `;
        
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync(filepath, code);
  console.log("Patched category block in " + filepath);
}

patchFile('server.ts');
patchFile('api/index.ts');
