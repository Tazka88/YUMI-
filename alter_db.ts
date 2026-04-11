import { sql } from './src/db/setup.js';

async function main() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0`;
    console.log('Columns added successfully');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    process.exit(0);
  }
}

main();
