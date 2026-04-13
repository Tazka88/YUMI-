import { sql } from './src/db/setup.js';

async function updateDb() {
  try {
    console.log('Adding sku to products...');
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);`;
    console.log('Database updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateDb();
