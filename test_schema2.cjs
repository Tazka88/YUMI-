const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });

(async () => {
  const [product] = await sql`
            SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
             CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(p.brand_name, b.name) as brand_name,
            c.name as category_name,
            c.slug as category_slug,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = 'tondeuse-cheveux-rechargeable-6w-kemei-km-1838'
  `;
  
  const allReviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
  
  // Try dynamic import for ESM module
  const { buildProductSchema } = await import('./src/lib/schemaUtils.ts');
  const schema = buildProductSchema(product, allReviews, 'url');
  console.log(JSON.stringify(schema, null, 2));
  process.exit(0);
})();
