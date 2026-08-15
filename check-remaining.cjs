const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function check() {
  const posts = await sql`SELECT id FROM blog_posts WHERE image_url LIKE 'data:%' OR image_1_url LIKE 'data:%' OR image_2_url LIKE 'data:%' OR image_3_url LIKE 'data:%' OR content LIKE '%data:image/%'`;
  console.log('Posts remaining with base64:', posts.length);
  
  const cats = await sql`SELECT id FROM categories WHERE image LIKE 'data:%'`;
  console.log('Cats remaining with base64:', cats.length);
  
  const prods = await sql`SELECT id FROM products WHERE image LIKE 'data:%' OR description LIKE '%data:image/%'`;
  console.log('Products remaining with base64:', prods.length);
  
  const sliders = await sql`SELECT id FROM slider_images WHERE image_url LIKE 'data:%' OR mobile_image_url LIKE 'data:%'`;
  console.log('Sliders remaining with base64:', sliders.length);

  process.exit(0);
}
check();
