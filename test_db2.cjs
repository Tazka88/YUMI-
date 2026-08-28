const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });
(async () => {
  const reviews = await sql`SELECT id, created_at FROM reviews WHERE product_id = 37 AND created_at IS NULL`;
  console.log("Reviews with null created_at:", reviews.length);
  process.exit(0);
})();
