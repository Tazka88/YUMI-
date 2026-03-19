import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function fix() {
  try {
    console.log(`Enabling RLS on hero_slides...`);
    await sql.unsafe(`ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;`);
    console.log('Successfully enabled RLS on hero_slides.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

fix();
