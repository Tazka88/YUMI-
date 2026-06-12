import { getSupabase } from '../src/lib/supabase.js';
import { sql } from '../src/db/setup.js';
import fs from 'fs';
import path from 'path';

// Helper to extract base64 and upload to Supabase
async function uploadBase64ToDb(base64String: string, folder: string, prefix: string): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not initialized');

  const matches = base64String.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64String; // Return original if not base64
  }

  const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  const fileName = `${folder}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const contentType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

  // Ensure bucket exists
  try {
    const { error: bucketError } = await supabase.storage.getBucket('images');
    if (bucketError && bucketError.message.includes('not found')) {
      await supabase.storage.createBucket('images', { public: true });
    }
  } catch (e) {}

  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

async function migrateTableImages() {
  console.log('Starting Base64 to Supabase Storage migration...');
  
  // Products
  console.log('Migrating products...');
  const products = await sql`SELECT id, image FROM products WHERE image LIKE 'data:image/%'`;
  for (const product of products) {
    try {
      const url = await uploadBase64ToDb(product.image, 'products', `prod-${product.id}`);
      await sql`UPDATE products SET image = ${url} WHERE id = ${product.id}`;
      console.log(`✅ Product ${product.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed product ${product.id}:`, e);
    }
  }

  // Categories
  console.log('Migrating categories...');
  const categories = await sql`SELECT id, image FROM categories WHERE image LIKE 'data:image/%'`;
  for (const cat of categories) {
    try {
      const url = await uploadBase64ToDb(cat.image, 'categories', `cat-${cat.id}`);
      await sql`UPDATE categories SET image = ${url} WHERE id = ${cat.id}`;
      console.log(`✅ Category ${cat.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed category ${cat.id}:`, e);
    }
  }

  // Subcategories
  console.log('Migrating subcategories...');
  const subcategories = await sql`SELECT id, image FROM subcategories WHERE image LIKE 'data:image/%'`;
  for (const cat of subcategories) {
    try {
      const url = await uploadBase64ToDb(cat.image, 'subcategories', `subcat-${cat.id}`);
      await sql`UPDATE subcategories SET image = ${url} WHERE id = ${cat.id}`;
      console.log(`✅ Subcategory ${cat.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed subcategory ${cat.id}:`, e);
    }
  }

  // Sub-subcategories
  console.log('Migrating sub_subcategories...');
  const sub_subcategories = await sql`SELECT id, image FROM sub_subcategories WHERE image LIKE 'data:image/%'`;
  for (const cat of sub_subcategories) {
    try {
      const url = await uploadBase64ToDb(cat.image, 'sub_subcategories', `subsubcat-${cat.id}`);
      await sql`UPDATE sub_subcategories SET image = ${url} WHERE id = ${cat.id}`;
      console.log(`✅ Sub-subcategory ${cat.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed sub-subcategory ${cat.id}:`, e);
    }
  }

  // Product Images
  console.log('Migrating product_images...');
  const product_images = await sql`SELECT id, image FROM product_images WHERE image LIKE 'data:image/%'`;
  for (const img of product_images) {
    try {
      const url = await uploadBase64ToDb(img.image, 'product_images', `prodimg-${img.id}`);
      await sql`UPDATE product_images SET image = ${url} WHERE id = ${img.id}`;
      console.log(`✅ Product Image ${img.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed product image ${img.id}:`, e);
    }
  }

  // Brands
  console.log('Migrating brands...');
  const brands = await sql`SELECT id, image FROM brands WHERE image LIKE 'data:image/%'`;
  for (const brand of brands) {
    try {
      const url = await uploadBase64ToDb(brand.image, 'brands', `brand-${brand.id}`);
      await sql`UPDATE brands SET image = ${url} WHERE id = ${brand.id}`;
      console.log(`✅ Brand ${brand.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed brand ${brand.id}:`, e);
    }
  }

  // Slider Images
  console.log('Migrating slider_images...');
  const slider_images = await sql`SELECT id, image_url, mobile_image_url FROM slider_images WHERE image_url LIKE 'data:image/%' OR mobile_image_url LIKE 'data:image/%'`;
  for (const slide of slider_images) {
    try {
      if (slide.image_url && slide.image_url.startsWith('data:image/')) {
        const url = await uploadBase64ToDb(slide.image_url, 'slider_images', `slider-${slide.id}`);
        await sql`UPDATE slider_images SET image_url = ${url} WHERE id = ${slide.id}`;
      }
      if (slide.mobile_image_url && slide.mobile_image_url.startsWith('data:image/')) {
        const url = await uploadBase64ToDb(slide.mobile_image_url, 'slider_images', `slider-m-${slide.id}`);
        await sql`UPDATE slider_images SET mobile_image_url = ${url} WHERE id = ${slide.id}`;
      }
      console.log(`✅ Slider Image ${slide.id} migrated`);
    } catch(e) {
      console.error(`❌ Failed slider image ${slide.id}:`, e);
    }
  }

  // Settings
  console.log('Migrating settings...');
  const settings = await sql`SELECT "key", value FROM settings WHERE value LIKE 'data:image/%'`;
  for (const setting of settings) {
    try {
      const url = await uploadBase64ToDb(setting.value, 'settings', `setting-${setting.key}`);
      await sql`UPDATE settings SET value = ${url} WHERE "key" = ${setting.key}`;
      console.log(`✅ Setting ${setting.key} migrated`);
    } catch(e) {
      console.error(`❌ Failed setting ${setting.key}:`, e);
    }
  }

  console.log('Migration completed!');
  process.exit(0);
}

// Run the script
migrateTableImages().catch(console.error);
