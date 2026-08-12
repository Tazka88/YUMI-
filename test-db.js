import { sql } from './src/db/setup.js';
async function run() {
  const posts = await sql`SELECT id, title, image_1_url FROM blog_posts ORDER BY id DESC LIMIT 5`;
  console.log(posts);
}
run();
