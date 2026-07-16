import { sql } from './src/db/setup.js';
async function run() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_company VARCHAR(50);`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stop_desk BOOLEAN;`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS office_id VARCHAR(255);`;
    await sql`ALTER TABLE orders ALTER COLUMN office_id TYPE VARCHAR(255);`;
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
run();
