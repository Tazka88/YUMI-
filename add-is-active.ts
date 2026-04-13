import { sql } from './src/db/setup.js';

async function updateDb() {
  try {
    console.log('Adding is_active to products...');
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`;
    console.log('Database updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateDb();
