const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /SELECT p\.id.*?WHERE p\.slug = \$\{slug\}/s;

const replacement = `SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
             CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(p.brand_name, b.name) as brand_name,
            c.name as category_name,
            c.slug as category_slug,
            sub.name as subcategory_name,
            sub.slug as subcategory_slug,
            subsub.name as sub_subcategory_name,
            subsub.slug as sub_subcategory_slug,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
            LEFT JOIN sub_subcategories subsub ON p.sub_subcategory_id = subsub.id
            WHERE p.slug = \${slug}`;

if(regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("SQL regex patch applied.");
} else {
  console.log("SQL regex Target not found.");
}
