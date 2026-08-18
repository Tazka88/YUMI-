import { sql } from './src/db/setup.js';
async function test() {
  const subs = await sql`SELECT slug, name FROM subcategories LIMIT 3`;
  console.log("SUBS:", subs);
  const subsubs = await sql`SELECT slug, name FROM sub_subcategories LIMIT 3`;
  console.log("SUBSUBS:", subsubs);
  process.exit(0);
}
test();
