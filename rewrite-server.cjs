const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// The block to replace:
// from `let isNotFound = false;` to `if (isNotFound) {`

const regex = /let isNotFound = false;[\s\S]*?(?=if \(isNotFound\))/;

const newCode = `let isNotFound = false;

        if (req.path === '/' || req.path === '/index.html') {
          const categories = await sql\`SELECT name, slug FROM categories\`;
          const brands = await sql\`SELECT name, slug FROM brands\`;
          
          headHtml += \`
            <link rel="preload" as="image" href="/api/hero-banners/first-image/mobile" media="(max-width: 767px)" fetchpriority="high">
            <link rel="preload" as="image" href="/api/hero-banners/first-image/desktop" media="(min-width: 768px)" fetchpriority="high">
          \`;
          
          seoHtml = ''; // No hidden content anymore
        } else if (req.path === '/brands') {
          title = 'Toutes nos marques - ZORANDO';
          seoHtml = ''; // No hidden content
        } else if (req.path.startsWith('/brands/')) {
          const slug = req.path.split('/')[2];
          const [brand] = await sql\`SELECT id, name, description, seo_title, seo_description, h1_title, seo_content FROM brands WHERE slug = \${slug}\`;
          
          if (brand) {
            title = brand.seo_title || \`\${brand.name} - ZORANDO\`;
            description = brand.seo_description || brand.description || \`Découvrez tous les produits de la marque \${brand.name} sur ZORANDO.\`;
            seoHtml = ''; // No hidden content
          } else {
            isNotFound = true;
          }
        } else if (req.path.startsWith('/category/')) {
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
        } else if (req.path.startsWith('/product/')) {
          const slug = req.path.split('/')[2];
          const [product] = await sql\`
            SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
            CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(p.brand_name, b.name) as brand_name,
            c.name as category_name,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = \${slug}
          \`;
          
          if (product) {
            title = product.seo_title || \`\${product.name} - ZORANDO\`;
            description = product.seo_description || (product.description ? product.description.substring(0, 160).replace(/<[^>]+>/g, '') : \`Achetez \${product.name} au meilleur prix sur ZORANDO.\`);
            
            if (product.seo_keywords) {
              headHtml += \`<meta name="keywords" content="\${product.seo_keywords}" />\`;
            }
            
            if (product.image) {
              if (product.image.startsWith('http')) {
                ogImage = product.image;
              } else if (product.image.startsWith('data:image')) {
                ogImage = \`\${baseUrl}/api/images/products/\${product.id}/image/\${slug}.webp?v=\${product.image.length}\`;
              } else {
                ogImage = product.image.startsWith('/') ? \`\${baseUrl}\${product.image}\` : \`\${baseUrl}/\${product.image}\`;
              }
            }
            
            // Build Server-Side JSON-LD
            const isPromo = product.promo_price !== null && product.promo_price !== undefined;
            const now = new Date();
            let isPromoValid = false;
            if (isPromo) {
                isPromoValid = true;
                if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
                if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
            }
            
            const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
            
            const schemaOffer = {
                "@type": "Offer",
                "url": \`\${baseUrl}/product/\${slug}\`,
                "priceCurrency": "DZD",
                "price": currentPrice,
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
            };
            
            if (isPromoValid && product.promo_price_end_date) {
                schemaOffer.priceValidUntil = new Date(product.promo_price_end_date).toISOString().split('T')[0];
            }
            
            const productSchema = {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": product.name,
                "image": ogImage,
                "description": description,
                "sku": product.sku || product.id.toString(),
                "mpn": product.sku || product.id.toString(),
                "category": product.category_name || "General",
                "brand": {
                    "@type": "Brand",
                    "name": product.brand_name || "ZORANDO"
                },
                "offers": schemaOffer
            };
            
            if (product.reviews_count > 0) {
                productSchema.aggregateRating = {
                    "@type": "AggregateRating",
                    "ratingValue": Number(product.avg_rating).toFixed(1),
                    "reviewCount": product.reviews_count,
                    "bestRating": 5,
                    "worstRating": 1
                };
            }
            
            seoHtml = \`<script type="application/ld+json">\${JSON.stringify(productSchema)}</script>\`;
          } else {
            isNotFound = true;
          }
        } else if (req.path.startsWith('/landing/')) {
          const slug = req.path.split('/')[2];
          const [landingPage] = await sql\`
            SELECT lp.id, lp.slug, lp.config, p.name as product_name, p.description as product_description, p.seo_title, p.seo_description, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as product_image
            FROM landing_pages lp
            JOIN products p ON lp.product_id = p.id
            WHERE lp.slug = \${slug}
          \`;
          
          if (landingPage) {
            const config = landingPage.config || {};
            title = config.seo_title || landingPage.seo_title || \`\${landingPage.product_name} | ZORANDO\`;
            description = config.seo_description || landingPage.seo_description || landingPage.product_description?.substring(0, 160).replace(/<[^>]+>/g, '') || \`Découvrez \${landingPage.product_name} sur Zorando.\`;
            
            if (landingPage.product_image) {
              if (landingPage.product_image.startsWith('http')) {
                ogImage = landingPage.product_image;
              } else if (landingPage.product_image.startsWith('data:image')) {
                ogImage = \`\${baseUrl}/api/images/products/\${landingPage.product_id}/image/\${slug}.webp?v=\${landingPage.product_image.length}\`;
              } else {
                ogImage = landingPage.product_image.startsWith('/') ? \`\${baseUrl}\${landingPage.product_image}\` : \`\${baseUrl}/\${landingPage.product_image}\`;
              }
            }
            
            seoHtml = ''; // No hidden content
          } else {
            isNotFound = true;
          }
        } else if (req.path === '/about') {
          title = 'À propos de nous - ZORANDO';
          description = 'Découvrez l\\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/programme-fidelite') {
          title = 'Programme de fidélité - ZORANDO';
          description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/retours') {
          title = 'Politique de retours - ZORANDO';
          description = 'Consultez notre politique de retours et remboursements.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/track-order') {
          title = 'Suivre ma commande - ZORANDO';
          description = 'Suivez l\\'état de votre commande ZORANDO en temps réel.';
          seoHtml = ''; // No hidden content
        }

        `;

code = code.replace(regex, newCode);

// Also remove globalNav hidden block
code = code.replace(
  /const globalNav = `[\s\S]*?`;\s*let finalHtml = template\.replace\('<!--seo-injection-->', globalNav \+ seoHtml\);/,
  `let finalHtml = template.replace('<!--seo-injection-->', seoHtml);`
);

fs.writeFileSync('server.ts', code);
