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
    console.log('Products:', products);
    
    products.forEach((p: any) => {
      try {
        p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      } catch (e) {
        console.error(`Error parsing features for product ${p.id}:`, e);
      }
      try {
        p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
      } catch (e) {
        console.error(`Error parsing key_points for product ${p.id}:`, e);
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
