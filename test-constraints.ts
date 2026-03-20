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
    const constraints = await sql`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'settings'::regclass;
    `;
    console.log('Constraints:', constraints);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
