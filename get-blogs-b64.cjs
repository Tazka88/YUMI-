const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const posts = await sql`SELECT id, title, slug, content FROM blog_posts`;
  posts.forEach(p => {
    if (p.content && p.content.includes('data:image')) {
       console.log(`ID: ${p.id}, Title: ${p.title} HAS BASE64 IMAGE!`);
    }
  });
  process.exit(0);
}
run();
