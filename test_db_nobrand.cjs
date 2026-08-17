const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function test() {
  const [product] = await sql`
    SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
    CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
    COALESCE(p.brand_name, b.name) as brand_name,
    c.name as category_name,
    (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
    (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = 'green-lion-ultra-slim-mag-batterie-externe-magnetique-sans-fil-4000-mah'
  `;

  const reviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
  console.log(JSON.stringify({product, reviews}, null, 2));
  process.exit(0);
}
test();
