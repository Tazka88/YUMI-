const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });
(async () => {
  const reviews = await sql`SELECT id FROM reviews WHERE created_at IS NULL`;
  console.log("Total reviews with null created_at:", reviews.length);
  process.exit(0);
})();
