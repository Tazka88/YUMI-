import { sql } from './src/db/index.js';

async function main() {
  try {
    await sql`ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS title TEXT`;
    await sql`ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS description TEXT`;
    await sql`ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS button_text TEXT`;
    await sql`ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS button_link TEXT`;
    console.log('Columns added successfully');
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
