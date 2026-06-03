import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres'.replace(':5432', ':6543'), { ssl: 'require' });

async function run() {
  const products = await sql`SELECT id, name, slug FROM products WHERE name ILIKE '%oneblade%' OR name ILIKE '%philips%'`;
  console.log('Found:', products);
  process.exit(0);
}
run();
