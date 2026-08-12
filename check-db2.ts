import { sql } from './src/db/setup';
async function run() {
  const posts = await sql`SELECT id, image_url, image_1_url, image_2_url, image_3_url FROM blog_posts WHERE id = 12`;
  console.log(posts[0]);
}
run();
