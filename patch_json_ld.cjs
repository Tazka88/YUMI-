const fs = require('fs');

const oldQuery = "const [product] = await sql`SELECT id, name, description, seo_title, seo_description, seo_keywords, price, promo_price, image FROM products WHERE slug = ${slug}`;"
const newQuery = "const [product] = await sql`SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.image, p.stock, c.name as category_name, c.slug as category_slug, b.name as brand_name FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE p.slug = ${slug}`;";

const oldSeoHtml = "const displayPrice = product.promo_price || product.price;\n          seoHtml = '';";
const newSeoHtml = `const displayPrice = product.promo_price || product.price;
          seoHtml = '';
          
          const schemaData = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Product",
                "name": product.name,
                "image": [ogImage],
                "description": product.seo_description || cleanForSEO(product.description, 160) || "",
                "sku": String(product.id),
                "brand": {
                  "@type": "Brand",
                  "name": product.brand_name || 'Zorando'
                },
                "offers": {
                  "@type": "Offer",
                  "url": \`\${baseUrl}/product/\${slug}\`,
                  "priceCurrency": "DZD",
                  "price": displayPrice.toString(),
                  "availability": product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                  "itemCondition": "https://schema.org/NewCondition",
                  "seller": {
                    "@type": "Organization",
                    "name": "Zorando",
                    "url": baseUrl
                  }
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Accueil",
                    "item": baseUrl
                  }
                ]
              }
            ]
          };

          if (product.category_name && product.category_slug) {
             schemaData["@graph"][1].itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": product.category_name,
                "item": \`\${baseUrl}/category/\${product.category_slug}\`
             });
             schemaData["@graph"][1].itemListElement.push({
                "@type": "ListItem",
                "position": 3,
                "name": product.name
             });
          } else {
             schemaData["@graph"][1].itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": product.name
             });
          }
          
          headHtml += \`\\n<script type="application/ld+json">\\n\${JSON.stringify(schemaData)}\\n</script>\\n\`;`;

function patch(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(oldQuery, newQuery);
  content = content.replace(oldSeoHtml, newSeoHtml);
  fs.writeFileSync(filepath, content);
  console.log('Patched ' + filepath);
}

patch('server.ts');
patch('api/index.ts');
