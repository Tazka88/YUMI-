const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });

(async () => {
  const [product] = await sql`
            SELECT p.id, p.name,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            WHERE p.slug = 'tondeuse-cheveux-rechargeable-6w-kemei-km-1838'
  `;
  console.log("Product:", product);
  
  const { buildProductSchema } = await import('./src/lib/schemaUtils.ts');
  const schema = buildProductSchema(product, [], 'url');
  console.log(JSON.stringify(schema, null, 2));
  process.exit(0);
})();
