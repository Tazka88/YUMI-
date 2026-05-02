import postgres from 'postgres';
async function run() {
   try {
      const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });
      await sql`SELECT 1`;
      console.log('Connected on 6543');
      process.exit(0);
   } catch(e) {
      console.error(e);
   }
}
run();
