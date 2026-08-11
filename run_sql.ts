import { sql } from './src/db/setup.js';
async function run() {
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_1_url TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_1_alt TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_2_url TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_2_alt TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_3_url TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_3_alt TEXT`;
  await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS main_image_alt TEXT`;
  console.log('done');
  process.exit(0);
}
run();
