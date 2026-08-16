const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const posts = await sql`SELECT id, title, image_url, image_1_url, image_2_url, image_3_url FROM blog_posts ORDER BY created_at DESC LIMIT 3`;
  posts.forEach(p => {
    ['image_url', 'image_1_url', 'image_2_url', 'image_3_url'].forEach(col => {
      if (p[col] && p[col].includes('data:image')) {
         console.log(`ID: ${p.id}, Col: ${col} HAS BASE64! length: ${p[col].length}`);
      } else if (p[col]) {
         console.log(`ID: ${p.id}, Col: ${col} is short URL: ${p[col].substring(0, 50)}`);
      }
    });
  });
  process.exit(0);
}
run();
