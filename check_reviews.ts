import { sql, setupDb } from './src/db/setup.js';
async function check() {
  await setupDb();
  const count = await sql`SELECT COUNT(*) FROM reviews WHERE product_id = 559`;
  console.log('Reviews count for 559:', count);
  process.exit(0);
}
check().catch(console.error);
