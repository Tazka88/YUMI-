import { sql } from './src/db/setup.ts';
async function run() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stop_desk BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS office_id INTEGER`;
  console.log('Orders table altered');
  process.exit(0);
}
run();
