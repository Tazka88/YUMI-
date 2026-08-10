const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// Insert new variables into POST /admin/products
code = code.replace(
  'is_active, images, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords } = req.body;',
  'is_active, images, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords, promo_price_start_date, promo_price_end_date } = req.body;'
);

code = code.replace(
  'INSERT INTO products (category_id, subcategory_id, sub_subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, main_image_alt, video_url, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, weight, is_active, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords)',
  'INSERT INTO products (category_id, subcategory_id, sub_subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, promo_price_start_date, promo_price_end_date, stock, image, main_image_alt, video_url, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, weight, is_active, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords)'
);

code = code.replace(
  'VALUES (${category_id || null}, ${subcategory_id || null}, ${sub_subcategory_id || null}, ${brand_id || null}, ${brand_name || null}, ${name || \'\'}, ${generatedSlug || \'\'}, ${description || null}, ${price || 0}, ${promo_price || null}, ${stock || 0},',
  'VALUES (${category_id || null}, ${subcategory_id || null}, ${sub_subcategory_id || null}, ${brand_id || null}, ${brand_name || null}, ${name || \'\'}, ${generatedSlug || \'\'}, ${description || null}, ${price || 0}, ${promo_price || null}, ${promo_price_start_date || null}, ${promo_price_end_date || null}, ${stock || 0},'
);


// Insert new variables into PUT /admin/products/:id (note: it's modified twice due to the if/else)
code = code.replace(
  'UPDATE products \n          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || \'\'}, slug = ${slug || \'\'}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, video_url = ${video_url || null}',
  'UPDATE products \n          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || \'\'}, slug = ${slug || \'\'}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, promo_price_start_date = ${promo_price_start_date || null}, promo_price_end_date = ${promo_price_end_date || null}, stock = ${stock || 0}, video_url = ${video_url || null}'
);

code = code.replace(
  'UPDATE products \n          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || \'\'}, slug = ${slug || \'\'}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, image = ${image || null}, video_url = ${video_url || null}',
  'UPDATE products \n          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || \'\'}, slug = ${slug || \'\'}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, promo_price_start_date = ${promo_price_start_date || null}, promo_price_end_date = ${promo_price_end_date || null}, stock = ${stock || 0}, image = ${image || null}, video_url = ${video_url || null}'
);

fs.writeFileSync('src/api/routes.ts', code);
