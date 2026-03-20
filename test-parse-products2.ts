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
    const products = await sql`SELECT id, features, key_points FROM products`;
    console.log('Products from DB:', products);
    
    products.forEach((p: any) => {
      console.log(`Product ${p.id} features type:`, typeof p.features, 'value:', p.features);
      try {
        p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
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
