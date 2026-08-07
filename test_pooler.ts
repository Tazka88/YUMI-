import postgres from 'postgres';

async function test() {
  const connStr = 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres';
  const sql = postgres(connStr, {
    ssl: 'require',
    max: 1,
    idle_timeout: 1,
    connect_timeout: 10,
    prepare: false,
  });

  try {
    const res = await sql`SELECT 1 as pooler_works`;
    console.log(res);
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
test();
