import { sql } from './src/db/setup';
import { getSupabase } from './src/lib/supabase';

async function uploadToSupabase(val, prefix) {
  const supabase = getSupabase();
  const base64Data = val.split(';base64,').pop();
  const extMatch = val.match(/^data:image\/([a-zA-Z0-9]+);/);
  let ext = extMatch ? extMatch[1] : 'png';
  if (ext === 'svg+xml') ext = 'svg';
  
  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `uploads/${prefix}-${Date.now()}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType: ext === 'svg' ? 'image/svg+xml' : `image/${ext}`,
      upsert: false
    });
    
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

async function migrateTable(tableName, idCol, fields) {
  console.log(`Migrating table ${tableName}...`);
  const rows = await sql.unsafe(`SELECT ${idCol}, ${fields.join(', ')} FROM ${tableName}`);
  for (const row of rows) {
    const updates = {};
    let hasUpdate = false;
    for (const field of fields) {
      const val = row[field];
      if (val && typeof val === 'string' && val.startsWith('data:image/')) {
        console.log(` - Migrating ${tableName} ${row[idCol]} field ${field}...`);
        try {
          const newUrl = await uploadToSupabase(val, `migrated-${tableName}-${row[idCol]}-${field}`);
          updates[field] = newUrl;
          hasUpdate = true;
          console.log(`   Success: ${newUrl}`);
        } catch (e) {
          console.error(`   Failed:`, e.message);
        }
      }
    }
    if (hasUpdate) {
      const setParts = Object.keys(updates).map(k => `${k} = '${updates[k]}'`);
      await sql.unsafe(`UPDATE ${tableName} SET ${setParts.join(', ')} WHERE ${idCol} = '${row[idCol]}'`);
      console.log(`Updated ${tableName} ${row[idCol]}`);
    }
  }
}

async function run() {
  await migrateTable('products', 'id', ['image']);
  await migrateTable('categories', 'id', ['image', 'slide_image', 'mobile_slide_image']);
  await migrateTable('subcategories', 'id', ['image']);
  await migrateTable('sub_subcategories', 'id', ['image']);
  await migrateTable('brands', 'id', ['image']);
  await migrateTable('product_images', 'id', ['image']);
  await migrateTable('settings', 'key', ['value']);
  await migrateTable('slider_images', 'id', ['image_url', 'mobile_image_url']);
  await migrateTable('blog_categories', 'id', ['image_url']);
  await migrateTable('reviews', 'id', ['image_url']);
  
  // Also check if any fields currently have `/api/images/` and warn about them
  const blogPosts = await sql`SELECT id, image_url, image_1_url FROM blog_posts WHERE image_url LIKE '/api/images/%'`;
  for (const p of blogPosts) {
     if (p.image_1_url) {
       console.log(`Fixing blog_post ${p.id} image_url to use image_1_url`);
       await sql`UPDATE blog_posts SET image_url = ${p.image_1_url} WHERE id = ${p.id}`;
     }
  }
  
  console.log("Done.");
}
run();
