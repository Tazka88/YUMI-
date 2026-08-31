const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Home page
code = code.replace(
  `        }
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/brands') {`,
  `        }
        seoHtml = \`
          <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>ZORANDO - Boutique en ligne en Algérie</h1>
            <p>\${description}</p>
            <h2>Nos Catégories</h2>
            <ul>\${categories.map((c) => \`<li><a href="/category/\${c.slug}">\${c.name}</a></li>\`).join('')}</ul>
            <h2>Nos Marques</h2>
            <ul>\${brands.map((b) => \`<li><a href="/brands/\${b.slug}">\${b.name}</a></li>\`).join('')}</ul>
          </div>
        \`;
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/brands') {`
);

// 2. Brands list page
code = code.replace(
  `      try {
        const brands = await sql\`SELECT name, slug FROM brands\`;
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }`,
  `      try {
        const brands = await sql\`SELECT name, slug FROM brands\`;
        seoHtml = \`
          <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>\${title}</h1>
            <p>Découvrez toutes les marques partenaires de Zorando.</p>
            <ul>\${brands.map((b) => \`<li><a href="/brands/\${b.slug}">\${b.name}</a></li>\`).join('')}</ul>
          </div>
        \`;
      } catch(e) { console.error("DB Error in SSR:", e); }`
);

// 3. Brand details page
code = code.replace(
  `          const products = await sql\`SELECT name, slug FROM products WHERE brand_id = \${brand.id}\`;
          seoHtml = '';
        } else {`,
  `          const products = await sql\`SELECT name, slug FROM products WHERE brand_id = \${brand.id} AND is_active = true LIMIT 50\`;
          seoHtml = \`
          <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>\${title}</h1>
            <p>\${description}</p>
            <h2>Produits \${brand.name}</h2>
            <ul>\${products.map((p) => \`<li><a href="/product/\${p.slug}">\${p.name}</a></li>\`).join('')}</ul>
          </div>
          \`;
        } else {`
);

// 4. Categories ALL
code = code.replace(
  `      if (slug === 'all') {
        title = 'Tous les produits | ZORANDO';
        description = 'Découvrez tous nos produits sur ZORANDO. Nouveautés, ventes flash et meilleures ventes. Achetez au meilleur prix.';
        seoHtml = '';
      } else if`,
  `      if (slug === 'all') {
        title = 'Tous les produits | ZORANDO';
        description = 'Découvrez tous nos produits sur ZORANDO. Nouveautés, ventes flash et meilleures ventes. Achetez au meilleur prix.';
        seoHtml = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true"><h1>\${title}</h1><p>\${description}</p></div>\`;
      } else if`
);

// 5. Category details
code = code.replace(
  `            if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;
            seoHtml = ''; // No hidden content
          } else {`,
  `            if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;
            seoHtml = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true"><h1>\${title}</h1><p>\${description}</p></div>\`;
          } else {`
);
code = code.replace(
  `              if (category) {
                title = \`\${category.name} | ZORANDO\`;
                description = \`Découvrez notre sélection de produits dans la catégorie \${category.name}. Achetez au meilleur prix sur ZORANDO.\`;
                seoHtml = '';
              } else {`,
  `              if (category) {
                title = \`\${category.name} | ZORANDO\`;
                description = \`Découvrez notre sélection de produits dans la catégorie \${category.name}. Achetez au meilleur prix sur ZORANDO.\`;
                seoHtml = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true"><h1>\${title}</h1><p>\${description}</p></div>\`;
              } else {`
);

// 6. Blog details
code = code.replace(
  `          if (post.main_image) {
            ogImage = post.main_image.startsWith('/') ? \`\${baseUrl}\${post.main_image}\` : \`\${baseUrl}/\${post.main_image}\`;
          }
        } else {`,
  `          if (post.main_image) {
            ogImage = post.main_image.startsWith('/') ? \`\${baseUrl}\${post.main_image}\` : \`\${baseUrl}/\${post.main_image}\`;
          }
          seoHtml = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>\${post.title}</h1>
            <p>\${post.excerpt}</p>
          </div>\`;
        } else {`
);

// 7. Blog list
code = code.replace(
  `    } else if (req.path === '/blog') {
      title = 'Blog & Actualités | Zorando';
      description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
    } else if (req.path === '/about') {`,
  `    } else if (req.path === '/blog') {
      title = 'Blog & Actualités | Zorando';
      description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
      try {
        const posts = await sql\`SELECT title, slug, excerpt FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 20\`;
        seoHtml = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
          <h1>\${title}</h1>
          <p>\${description}</p>
          <ul>\${posts.map((p) => \`<li><h2><a href="/blog/\${p.slug}">\${p.title}</a></h2><p>\${p.excerpt}</p></li>\`).join('')}</ul>
        </div>\`;
      } catch (e) { console.error("DB error in blog SSR", e); }
    } else if (req.path === '/about') {`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts successfully');
