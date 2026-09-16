import re

moulinex_ssr_block = """
      if (categorySlug) {
        try {
          const [brand] = await sql`SELECT id, name, slug FROM brands WHERE slug = ${slug}`;
          const [category] = await sql`SELECT id, name, slug FROM categories WHERE slug = ${categorySlug}`;
          
          if (brand && category) {
            if (brand.slug === 'electromenager-moulinex-algerie') {
              const catName = category.name;
              title = `${catName} Moulinex en Algérie | Prix & Achat | ZORANDO`;
              description = `Découvrez la gamme de ${catName.toLowerCase()} Moulinex disponibles chez ZORANDO. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.`;
              ogUrl = `${baseUrl}${req.path}`;
              
              const products = await sql`
                SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, 
                CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image
                FROM products p
                WHERE p.brand_id = ${brand.id} AND p.category_id = ${category.id} AND p.is_active = true
                LIMIT 50
              `;
              
              let productsHtml = products.map((p: any) => `
                <div>
                  <h3><a href="/product/${p.slug}">${p.name}</a></h3>
                  <p>Prix : ${p.promo_price || p.price} DZD</p>
                  ${p.stock > 0 ? '<p>En stock</p>' : '<p>Rupture de stock</p>'}
                </div>
              `).join('');

              let jsonLdProducts = products.map((p: any) => ({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": p.name,
                "image": p.image ? (p.image.startsWith('/') ? `${baseUrl}${p.image}` : p.image) : undefined,
                "brand": { "@type": "Brand", "name": brand.name },
                "sku": p.sku || undefined,
                "offers": {
                  "@type": "Offer",
                  "url": `${baseUrl}/product/${p.slug}`,
                  "priceCurrency": "DZD",
                  "price": p.promo_price || p.price,
                  "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }));

              let breadcrumbJson = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${baseUrl}/` },
                  { "@type": "ListItem", "position": 2, "name": "Marques", "item": `${baseUrl}/brands` },
                  { "@type": "ListItem", "position": 3, "name": brand.name, "item": `${baseUrl}/brands/${slug}` },
                  { "@type": "ListItem", "position": 4, "name": category.name, "item": `${baseUrl}${req.path}` }
                ]
              };

              headHtml += `\\n<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;
              jsonLdProducts.forEach((p: any) => { 
                 headHtml += `\\n<script type="application/ld+json">${JSON.stringify(p)}</script>`;
              });

              seoHtml = `
              <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-sm max-w-none text-gray-700">
                <h1>${catName} Moulinex en Algérie</h1>
                <p>Vous recherchez un(e) ${catName.toLowerCase()} Moulinex en Algérie ? ZORANDO vous propose une sélection de ${catName.toLowerCase()} électriques Moulinex adaptées à différents besoins et budgets. Retrouvez des modèles variés et performants selon vos attentes.</p>
                <p>Comparez facilement les ${catName.toLowerCase()} Moulinex disponibles : capacité, puissance, fonctionnalités et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
                <p>Commandez votre ${catName.toLowerCase()} Moulinex en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
                
                ${productsHtml}
                
                <h2>Quel(le) ${catName.toLowerCase()} Moulinex choisir ?</h2>
                <p>Le choix dépend avant tout de votre utilisation quotidienne. Pour une utilisation familiale, une grande capacité sera idéale. Si vous avez peu de place ou une utilisation individuelle, des capacités plus réduites sont très pratiques.</p>
                
                <h2>Les ${catName.toLowerCase()} Moulinex disponibles chez ZORANDO</h2>
                <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre capacité, puissance, et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle.</p>
                
                <h2>FAQ – ${catName} Moulinex</h2>
                <h3>Quel(le) ${catName.toLowerCase()} Moulinex choisir pour une famille ?</h3>
                <p>Pour une utilisation familiale, un(e) ${catName.toLowerCase()} Moulinex de grande capacité offre une solution adaptée pour répondre aux besoins de plusieurs personnes.</p>
                
                <h3>Quel est le prix d'un(e) ${catName.toLowerCase()} Moulinex en Algérie ?</h3>
                <p>Le prix dépend du modèle, de sa capacité, de sa puissance et de ses fonctionnalités. ZORANDO affiche le prix actuel directement sur chaque fiche produit afin de permettre de comparer les modèles Moulinex disponibles.</p>
                
                <h3>Les ${catName.toLowerCase()} Moulinex sont-ils/elles disponibles avec livraison en Algérie ?</h3>
                <p>Oui. Les ${catName.toLowerCase()} Moulinex disponibles sur ZORANDO peuvent être commandées en ligne avec livraison dans les 58 wilayas d'Algérie et paiement à la livraison, selon les conditions affichées sur la fiche du produit.</p>
                
                <h2>Pourquoi acheter un(e) ${catName.toLowerCase()} Moulinex chez ZORANDO ?</h2>
                <p>ZORANDO vous permet de comparer plusieurs modèles de ${catName.toLowerCase()} Moulinex selon leur capacité, leur puissance, leur design et leurs fonctionnalités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
              </div>
              `;
            } else {
              title = `${category.name} ${brand.name} en Algérie | Prix & Achat | ZORANDO`;
              description = `Découvrez les ${category.name.toLowerCase()} ${brand.name} disponibles en Algérie sur Zorando. Consultez les modèles, caractéristiques et prix des ${category.name.toLowerCase()} ${brand.name}.`;
              ogUrl = `${baseUrl}${req.path}`;
              
              const products = await sql`
                SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, 
                CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image
                FROM products p
                WHERE p.brand_id = ${brand.id} AND p.category_id = ${category.id} AND p.is_active = true
                LIMIT 50
              `;
              
              let productsHtml = products.map((p: any) => `
                <div>
                  <h3><a href="/product/${p.slug}">${p.name}</a></h3>
                  <p>Prix : ${p.promo_price || p.price} DZD</p>
                  ${p.stock > 0 ? '<p>En stock</p>' : '<p>Rupture de stock</p>'}
                </div>
              `).join('');

              let jsonLdProducts = products.map((p: any) => ({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": p.name,
                "image": p.image ? (p.image.startsWith('/') ? `${baseUrl}${p.image}` : p.image) : undefined,
                "brand": { "@type": "Brand", "name": brand.name },
                "sku": p.sku || undefined,
                "offers": {
                  "@type": "Offer",
                  "url": `${baseUrl}/product/${p.slug}`,
                  "priceCurrency": "DZD",
                  "price": p.promo_price || p.price,
                  "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }));

              let breadcrumbJson = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${baseUrl}/` },
                  { "@type": "ListItem", "position": 2, "name": "Marques", "item": `${baseUrl}/brands` },
                  { "@type": "ListItem", "position": 3, "name": brand.name, "item": `${baseUrl}/brands/${slug}` },
                  { "@type": "ListItem", "position": 4, "name": category.name, "item": `${baseUrl}${req.path}` }
                ]
              };

              headHtml += `\\n<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;
              jsonLdProducts.forEach((p: any) => { 
                 headHtml += `\\n<script type="application/ld+json">${JSON.stringify(p)}</script>`;
              });

              seoHtml = `
              <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-sm max-w-none text-gray-700">
                <h1>${category.name} ${brand.name} en Algérie</h1>
                <p>${description}</p>
                ${productsHtml}
                <h2>Les produits ${category.name} ${brand.name} disponibles chez ZORANDO</h2>
                <p>Comparez les modèles pour trouver le bon équilibre entre capacité, puissance et prix. Profitez de la livraison dans les 58 wilayas d'Algérie.</p>
              </div>
              `;
            }
"""

for filename in ['server.ts', 'api/index.ts']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # We match from "if (categorySlug) {" to "catch(e) { console.error("DB Error in SSR generic brand cat:", e); }"
    
    pattern = r"if \(categorySlug\) \{[\s\S]*?\} catch\(e\) \{ console\.error\(\"DB Error in SSR generic brand cat:\", e\); \}"
    
    if re.search(pattern, code):
        replacement = moulinex_ssr_block.strip() + "\n          } else {\n             isNotFound = true;\n          }\n        } catch(e) { console.error(\"DB Error in SSR generic brand cat:\", e); }"
        new_code = re.sub(pattern, replacement, code)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_code)
        print(f"Patched {filename}")
    else:
        print(f"Could not find pattern in {filename}")
