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
    const products = await sql`SELECT id, name FROM products ORDER BY id DESC LIMIT 5`;
    console.log('Products:', products);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
