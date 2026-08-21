const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });
async function run() {
  const res = await sql`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'products'`;
  console.log(res);
  process.exit(0);
}
run();
