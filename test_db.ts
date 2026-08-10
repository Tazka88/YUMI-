import { sql } from './src/db/setup.js';
async function test() {
  try {
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`;
    console.log(res.map(r => r.column_name));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
test();
