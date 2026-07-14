import { sql, setupDb } from './src/db/setup.js';
async function check() {
  await setupDb();
  const res = await sql`SELECT id, name, slug, is_active FROM products WHERE slug ILIKE '%support-d-clairage-professionnel%'`;
  console.log(res);
  process.exit(0);
}
check().catch(console.error);
