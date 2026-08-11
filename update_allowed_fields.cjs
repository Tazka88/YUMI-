const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

code = code.replace(
  "const allowedFields = ['image', 'value', 'image_url', 'slide_image', 'mobile_slide_image', 'mobile_image_url'];",
  "const allowedFields = ['image', 'value', 'image_url', 'slide_image', 'mobile_slide_image', 'mobile_image_url', 'image_1_url', 'image_2_url', 'image_3_url'];"
);

// We should also replace the query for single post and admin posts to use CASE WHEN for the new images
code = code.replace(
  "p.image_url END as image_url, p.image_1_url, p.image_1_alt, p.image_2_url, p.image_2_alt, p.image_3_url, p.image_3_alt",
  "p.image_url END as image_url, CASE WHEN p.image_1_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_1_url?v=' || LENGTH(p.image_1_url) ELSE p.image_1_url END as image_1_url, p.image_1_alt, CASE WHEN p.image_2_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_2_url?v=' || LENGTH(p.image_2_url) ELSE p.image_2_url END as image_2_url, p.image_2_alt, CASE WHEN p.image_3_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_3_url?v=' || LENGTH(p.image_3_url) ELSE p.image_3_url END as image_3_url, p.image_3_alt"
);

fs.writeFileSync('src/api/routes.ts', code);
