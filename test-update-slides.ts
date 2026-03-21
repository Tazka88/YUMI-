import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
sql`UPDATE slides SET image = 'https://picsum.photos/seed/slide/1920/600'`.then(res => { console.log('Updated slides'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
