import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
sql`UPDATE products SET image = 'https://picsum.photos/seed/picsum/600/400' WHERE image = 'test.jpg'`.then(res => { console.log('Updated images'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
