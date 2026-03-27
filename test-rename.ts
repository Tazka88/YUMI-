import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
sql`ALTER TABLE users RENAME TO users_old`.then(res => { console.log('Renamed'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
