import postgres from 'postgres';
import bcrypt from 'bcryptjs';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
const hash = bcrypt.hashSync('admin123', 10);
sql`UPDATE users SET password = ${hash} WHERE email = 'admin@admin.com'`.then(res => { console.log('Updated'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });
