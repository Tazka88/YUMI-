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
  // Update as needed based on your other tables with base64 columns

  console.log('Migration completed!');
  process.exit(0);
}

// Run the script
migrateTableImages().catch(console.error);
