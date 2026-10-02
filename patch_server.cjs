const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const oldBrandBlock = `    } else if (req.path.startsWith('/brands/')) {
      const slug = req.path.split('/')[2];
      try {
        const [brand] = await sql\`SELECT id, name, description, seo_title, seo_description FROM brands WHERE slug = \${slug}\`;`;

const newBrandBlock = `    } else if (req.path.startsWith('/brands/')) {
      const parts = req.path.split('/');
      const slug = parts[2];
      const categorySlug = parts[3];

      if (slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires') {
        title = '🍳 Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO';
        description = 'Découvrez les bouilloires Moulinex disponibles chez ZORANDO : 0,8 L, 1,2 L, 1,7 L, 2000 W, 2400 W et plus. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.';
        keywords = '';
        ogUrl = \`\${baseUrl}\${req.path}\`;
        
        try {
          const products = await sql\`
            SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, 
            CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            JOIN categories c ON p.category_id = c.id
            WHERE b.slug = \${slug} AND c.slug = \${categorySlug} AND p.is_active = true
            LIMIT 50
          \`;
          
          let productsHtml = products.map(p => \`
            <div>
              <h3><a href="/product/\${p.slug}">\${p.name}</a></h3>
              <p>Prix : \${p.promo_price || p.price} DZD</p>
              \${p.stock > 0 ? '<p>En stock</p>' : '<p>Rupture de stock</p>'}
            </div>
          \`).join('');

          let jsonLdProducts = products.map(p => ({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p.name,
            "image": p.image ? \`\${baseUrl}\${p.image}\` : undefined,
            "brand": { "@type": "Brand", "name": "Moulinex" },
            "sku": p.sku || undefined,
            "offers": {
              "@type": "Offer",
              "url": \`\${baseUrl}/product/\${p.slug}\`,
              "priceCurrency": "DZD",
              "price": p.promo_price || p.price,
              "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          }));

          let breadcrumbJson = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "\${baseUrl}/" },
              { "@type": "ListItem", "position": 2, "name": "Marques", "item": "\${baseUrl}/brands" },
              { "@type": "ListItem", "position": 3, "name": "Moulinex", "item": "\${baseUrl}/brands/electromenager-moulinex-algerie" },
              { "@type": "ListItem", "position": 4, "name": "Bouilloires", "item": \`\${baseUrl}\${req.path}\` }
            ]
          };

          headHtml += \`\\n<script type="application/ld+json">\${JSON.stringify(breadcrumbJson)}</script>\`;
          jsonLdProducts.forEach(p => {
             headHtml += \`\\n<script type="application/ld+json">\${JSON.stringify(p)}</script>\`;
          });

          seoHtml = \`
          <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>☕ Bouilloires Moulinex en Algérie</h1>
            <p>Vous recherchez une bouilloire Moulinex en Algérie pour préparer rapidement votre thé, café ou infusion ? ZORANDO vous propose une sélection de bouilloires électriques Moulinex adaptées à différents besoins et budgets. Retrouvez des modèles compacts de 0,8 L, des capacités de 1,2 L et des bouilloires familiales de 1,7 L, avec différentes puissances comme 2000 W et 2400 W selon les modèles. Comparez facilement les bouilloires Moulinex disponibles : capacité, puissance, matière, filtre anticalcaire, socle 360°, arrêt automatique et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation. Commandez votre bouilloire Moulinex en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
            \${productsHtml}
            <h2>Quelle bouilloire Moulinex choisir ?</h2>
            <p>Pour une utilisation familiale, une bouilloire Moulinex de 1,7 L offre une capacité adaptée pour chauffer davantage d'eau en une seule fois. Une capacité de 0,8 L convient notamment pour une utilisation individuelle ou lorsque peu d'eau est nécessaire.</p>
            <h2>Les bouilloires Moulinex disponibles chez ZORANDO</h2>
            <h2>FAQ – Bouilloires Moulinex</h2>
            <h2>Pourquoi acheter une bouilloire Moulinex chez ZORANDO ?</h2>
          </div>
          \`;
        } catch(e) { console.error("DB Error in SSR custom page:", e); }
      } else {
      try {
        const [brand] = await sql\`SELECT id, name, description, seo_title, seo_description FROM brands WHERE slug = \${slug}\`;`;

if (content.includes(oldBrandBlock)) {
    content = content.replace(oldBrandBlock, newBrandBlock);
    
    // We also need to add a closing brace for the `else {` we added.
    const targetCloseBrace = `      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/category/')) {`;
    
    const newTargetCloseBrace = `      } catch(e) { console.error("DB Error in SSR:", e); }
      }
    } else if (req.path.startsWith('/category/')) {`;
    
    content = content.replace(targetCloseBrace, newTargetCloseBrace);
    fs.writeFileSync('server.ts', content);
    console.log("Patched server.ts successfully");
} else {
    console.log("old brand block not found");
}

