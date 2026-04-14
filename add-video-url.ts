import { sql } from './src/db/setup.js';

async function run() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;`;
    console.log('Added video_url column to products table.');
  } catch (error) {
    console.error('Error adding video_url column:', error);
  } finally {
    process.exit(0);
  }
}

run();
