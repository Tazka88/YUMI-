import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
sql`UPDATE products SET is_popular = true, is_best_seller = true, is_new = true`.then(res => { console.log('Updated products'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
