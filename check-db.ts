import { sql } from './src/db/setup';
async function run() {
  const posts = await sql`SELECT id, image_url FROM blog_posts WHERE id = 12`;
  console.log(posts[0].image_url?.substring(0, 50));
}
run();
