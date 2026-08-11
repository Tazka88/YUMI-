const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// The route is:
// router.get('/admin/blog/posts', authenticate, async (req, res) => {
//   try {
//     const posts = await sql`
//       SELECT ${sql.unsafe(BLOG_POSTS_LIST_COLS)}, c.name as category_name 

code = code.replace(
  "SELECT ${sql.unsafe(BLOG_POSTS_LIST_COLS)}, c.name as category_name \\n       FROM blog_posts p",
  "SELECT p.id, p.category_id, p.title, p.slug, p.excerpt, p.content, CASE WHEN p.image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_url?v=' || LENGTH(p.image_url) ELSE p.image_url END as image_url, p.image_1_url, p.image_1_alt, p.image_2_url, p.image_2_alt, p.image_3_url, p.image_3_alt, p.main_image_alt, p.status, p.published_at, p.created_at, p.seo_title, p.seo_description, c.name as category_name \\n       FROM blog_posts p"
);

fs.writeFileSync('src/api/routes.ts', code);
