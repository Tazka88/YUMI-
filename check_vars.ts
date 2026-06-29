import { sql, setupDb } from './src/db/setup.js';
async function test() {
  await setupDb();
  const variations = await sql`SELECT id, variations, pg_typeof(variations) as pt, jsonb_typeof(variations) as jt FROM products WHERE variations IS NOT NULL LIMIT 10`;
  console.log(variations);
  process.exit(0);
}
test();
