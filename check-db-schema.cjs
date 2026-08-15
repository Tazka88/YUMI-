const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function check() {
  try {
    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`;
    console.log(cols.map(c => c.column_name).join(', '));
  } catch (e) {
    console.log(e);
  }
  process.exit(0);
}
check();
