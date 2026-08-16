const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function cleanBase64() {
  console.log("Fetching posts...");
  const posts = await sql`SELECT id, title, image_url, image_1_url, image_2_url, image_3_url, content FROM blog_posts`;
  
  let cleanedCount = 0;
  for (const p of posts) {
    let updateNeeded = false;
    let updates = {};

    const imageCols = ['image_url', 'image_1_url', 'image_2_url', 'image_3_url'];
    for (const col of imageCols) {
      if (p[col] && p[col].startsWith('data:image')) {
        updates[col] = null;
        updateNeeded = true;
      }
    }

    if (p.content && p.content.includes('data:image')) {
      const cleanedContent = p.content.replace(/<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi, '');
      if (cleanedContent !== p.content) {
        updates.content = cleanedContent;
        updateNeeded = true;
      }
    }

    if (updateNeeded) {
      console.log(`Cleaning post ID ${p.id} - ${p.title}...`);
      await sql`UPDATE blog_posts SET ${sql(updates)} WHERE id = ${p.id}`;
      cleanedCount++;
    }
  }
  
  console.log(`Cleanup complete! Cleaned ${cleanedCount} posts.`);
  process.exit(0);
}

cleanBase64().catch(err => {
  console.error(err);
  process.exit(1);
});
