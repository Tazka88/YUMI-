import { sql } from './src/db/setup.js';

async function run() {
  console.log('Adding status field to order_items...');

  try {
    await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`;
    console.log('Successfully added status field to order_items.');
  } catch (err) {
    console.error('Error adding status field:', err);
  } finally {
    process.exit(0);
  }
}

run();
