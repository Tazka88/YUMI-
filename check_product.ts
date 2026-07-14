import { sql, setupDb } from './src/db/setup.js';
async function check() {
  await setupDb();
  const res = await sql`SELECT slug, is_active FROM products WHERE slug ILIKE '%philips-oneblade-qp2427%'`;
  console.log(res);
  process.exit(0);
}
check().catch(console.error);
