const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const posts = await sql`SELECT id, title, slug, content FROM blog_posts ORDER BY created_at DESC LIMIT 3`;
  posts.forEach(p => {
    console.log(`\nID: ${p.id}, Title: ${p.title}`);
    console.log(p.content ? p.content.substring(0, 500) : '');
    const imgMatches = p.content ? p.content.match(/<img[^>]+src="([^"]+)"/g) : null;
    if (imgMatches) {
        console.log("Images found:");
        imgMatches.forEach(m => console.log(m.substring(0, 100)));
    }
  });
  process.exit(0);
}
run();
