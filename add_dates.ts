import { sql } from './src/db/setup.js';
async function test() {
  console.log("Adding columns...");
  try {
    await sql`ALTER TABLE products ADD COLUMN promo_price_start_date TIMESTAMP`;
  } catch(e) {}
  try {
    await sql`ALTER TABLE products ADD COLUMN promo_price_end_date TIMESTAMP`;
  } catch(e) {}
  console.log("Done");
  process.exit(0);
}
test();
