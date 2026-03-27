import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
sql`SELECT count(*) FROM products`.then(res => { console.log(res); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
