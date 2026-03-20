import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require' });
sql`SELECT 1`.then(() => { console.log('Connected'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
