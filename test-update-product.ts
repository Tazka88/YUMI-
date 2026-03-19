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
    const [product] = await sql`SELECT * FROM products LIMIT 1`;
    console.log('Before update:', product.name);
    
    await sql`UPDATE products SET name = ${product.name + ' updated'} WHERE id = ${product.id}`;
    
    const [updated] = await sql`SELECT * FROM products WHERE id = ${product.id}`;
    console.log('After update:', updated.name);
    
    // Revert
    await sql`UPDATE products SET name = ${product.name} WHERE id = ${product.id}`;
    
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
