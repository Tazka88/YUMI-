import { sql } from './src/db/setup.js';

async function run() {
  console.log('Adding SEO keywords field...');

  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT;`;
    console.log('Successfully added SEO keywords field.');
  } catch (err) {
    console.error('Error adding SEO keywords field:', err);
  } finally {
    process.exit(0);
  }
}

run();
