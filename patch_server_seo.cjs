const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const target = `        } else if (req.path.startsWith('/category/')) {
          const slug = req.path.split('/')[2];
          const [category] = await sql\`SELECT id, name, description FROM categories WHERE slug = \${slug}\`;
          
          if (category) {
            title = \`\${category.name} - ZORANDO\`;
            description = category.description || \`Découvrez nos produits dans la catégorie \${category.name}.\`;
            seoHtml = ''; // No hidden content
          } else {
            const [subcat] = await sql\`SELECT id, name FROM subcategories WHERE slug = \${slug}\`;
            if (subcat) {
              title = \`\${subcat.name} - ZORANDO\`;
              seoHtml = ''; // No hidden content
            } else {
              const [subSubcat] = await sql\`SELECT id, name FROM sub_subcategories WHERE slug = \${slug}\`;
              if (subSubcat) {
                title = \`\${subSubcat.name} - ZORANDO\`;
                seoHtml = ''; // No hidden content
              } else {
                isNotFound = true;
              }
            }
          }
        } else if (req.path.startsWith('/product/')) {`;

const replacement = `        } else if (req.path.startsWith('/category/')) {
          const slug = req.path.split('/')[2];
          const [category] = await sql\`SELECT id, name, description FROM categories WHERE slug = \${slug}\`;
          
          if (category) {
            if (categorySEOData[slug]) {
              title = categorySEOData[slug].title;
              description = categorySEOData[slug].description;
            } else {
              title = \`\${category.name} | ZORANDO\`;
              description = \`Découvrez notre sélection de produits dans la catégorie \${category.name}. Achetez au meilleur prix sur ZORANDO.\`;
            }
            seoHtml = ''; // No hidden content
          } else {
            const [subcat] = await sql\`SELECT id, name FROM subcategories WHERE slug = \${slug}\`;
            if (subcat) {
              if (categorySEOData[slug]) {
                title = categorySEOData[slug].title;
                description = categorySEOData[slug].description;
              } else {
                title = \`\${subcat.name} | ZORANDO\`;
                description = \`Découvrez notre sélection de produits dans la catégorie \${subcat.name}. Achetez au meilleur prix sur ZORANDO.\`;
              }
              seoHtml = ''; // No hidden content
            } else {
              const [subSubcat] = await sql\`SELECT id, name FROM sub_subcategories WHERE slug = \${slug}\`;
              if (subSubcat) {
                if (categorySEOData[slug]) {
                  title = categorySEOData[slug].title;
                  description = categorySEOData[slug].description;
                } else {
                  title = \`\${subSubcat.name} | ZORANDO\`;
                  description = \`Découvrez notre sélection de produits dans la catégorie \${subSubcat.name}. Achetez au meilleur prix sur ZORANDO.\`;
                }
                seoHtml = ''; // No hidden content
              } else {
                isNotFound = true;
              }
            }
          }
        } else if (req.path.startsWith('/product/')) {`;

if (content.includes(target)) {
  fs.writeFileSync('server.ts', content.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found");
}
