import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });
async function run() {
  try {
    await sql`ALTER TABLE categories ALTER COLUMN image TYPE TEXT`;
    await sql`ALTER TABLE subcategories ALTER COLUMN image TYPE TEXT`;
    await sql`ALTER TABLE brands ALTER COLUMN image TYPE TEXT`;
    await sql`ALTER TABLE products ALTER COLUMN image TYPE TEXT`;
    await sql`ALTER TABLE product_images ALTER COLUMN image TYPE TEXT`;
    await sql`ALTER TABLE slides ALTER COLUMN image TYPE TEXT`;
    console.log('Altered columns to TEXT');
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
