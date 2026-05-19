import { sql } from './src/db/setup.js';

async function run() {
  console.log('Adding SEO fields...');

  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;`;
    await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(255);`;

    console.log('Successfully added SEO fields.');
  } catch (err) {
    console.error('Error adding SEO fields:', err);
  } finally {
    process.exit(0);
  }
}

run();
