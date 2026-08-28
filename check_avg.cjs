const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });

(async () => {
  const [stats] = await sql`SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews WHERE product_id = 553`;
  console.log("Stats:", stats);
  process.exit(0);
})();
