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
    const features = [{"key": "A", "value": "B"}];
    await sql`UPDATE products SET features = ${JSON.stringify(features)}::jsonb WHERE id = 4`;
    
    const products = await sql`SELECT id, features, key_points FROM products WHERE id = 4`;
    
    products.forEach((p: any) => {
      console.log(`Product ${p.id} features type:`, typeof p.features, 'value:', JSON.stringify(p.features));
      try {
        const parsed = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
        console.log(`Parsed:`, parsed);
      } catch (e) {
        console.error(`Error parsing features for product ${p.id}:`, e.message);
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
