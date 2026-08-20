import { sql, setupDb } from './src/db/setup.js';
async function run() {
  await setupDb();
  const res1 = await sql`SELECT id, position FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC LIMIT 5`;
  console.log(res1);
  process.exit(0);
}
run();
