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
      SELECT p.*, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      LIMIT 100
    `;
    
    products.forEach((p: any) => {
      p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
    });

    console.log('Success! Products:', products.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
