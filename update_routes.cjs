const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// Replace the GET single post query to include the new images
code = code.replace(
  "SELECT p.id, p.category_id, p.title, p.slug, p.excerpt, p.content, CASE WHEN p.image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_url?v=' || LENGTH(p.image_url) ELSE p.image_url END as image_url, p.status, p.published_at, p.created_at, p.seo_title, p.seo_description, c.name as category_name, c.slug as category_slug",
  "SELECT p.id, p.category_id, p.title, p.slug, p.excerpt, p.content, CASE WHEN p.image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_url?v=' || LENGTH(p.image_url) ELSE p.image_url END as image_url, p.image_1_url, p.image_1_alt, p.image_2_url, p.image_2_alt, p.image_3_url, p.image_3_alt, p.main_image_alt, p.status, p.published_at, p.created_at, p.seo_title, p.seo_description, c.name as category_name, c.slug as category_slug"
);

// Replace POST /admin/blog/posts
code = code.replace(
  "const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description } = req.body;",
  "const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt, main_image_alt } = req.body;"
);

code = code.replace(
  "INSERT INTO blog_posts (category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, published_at)",
  "INSERT INTO blog_posts (category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, published_at, image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt, main_image_alt)"
);

code = code.replace(
  "VALUES (${category_id || null}, ${title}, ${slug}, ${excerpt}, ${content}, ${image_url}, ${status}, ${seo_title}, ${seo_description}, ${published_at})",
  "VALUES (${category_id || null}, ${title}, ${slug}, ${excerpt}, ${content}, ${image_url}, ${status}, ${seo_title}, ${seo_description}, ${published_at}, ${image_1_url || null}, ${image_1_alt || null}, ${image_2_url || null}, ${image_2_alt || null}, ${image_3_url || null}, ${image_3_alt || null}, ${main_image_alt || null})"
);

// Replace PUT /admin/blog/posts/:id
code = code.replace(
  "const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description } = req.body;",
  "const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt, main_image_alt } = req.body;"
);

code = code.replace(
  "content = ${content}, image_url = ${image_url}, status = ${status},",
  "content = ${content}, image_url = ${image_url}, status = ${status},\n         image_1_url = ${image_1_url || null}, image_1_alt = ${image_1_alt || null},\n         image_2_url = ${image_2_url || null}, image_2_alt = ${image_2_alt || null},\n         image_3_url = ${image_3_url || null}, image_3_alt = ${image_3_alt || null}, main_image_alt = ${main_image_alt || null},"
);

fs.writeFileSync('src/api/routes.ts', code);
