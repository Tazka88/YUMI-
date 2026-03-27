import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function test() {
  try {
    const products = await sql`
      SELECT p.*, c.name as category_name, s.name as subcategory_name, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `;
    console.log('Products:', products.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
