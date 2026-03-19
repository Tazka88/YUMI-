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
    
    const productIds = products.map((p: any) => p.id);
    if (productIds.length > 0) {
      const images = await sql`SELECT * FROM product_images WHERE product_id IN ${sql(productIds)}`;
      products.forEach((p: any) => {
        p.images = images.filter((img: any) => img.product_id === p.id);
      });
    }
    
    products.forEach((p: any) => {
      p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
    });

    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
