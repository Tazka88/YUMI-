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

  let retries = 3;
  while (retries > 0) {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false
      });

    if (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
    } else {
      break;
    }
  }

  const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// Reusable batch process function 
async function processTableBatch(
  tableName: string, 
  idCol: string, 
  imageCols: string[], 
  folder: string,
  prefix: string
) {
  console.log(`\nMigrating ${tableName}...`);
  let totalProcessed = 0;
  
  while (true) {
    // Construct where clause for all image columns
    const whereConditions = imageCols.map(col => `"${col}" LIKE 'data:image/%'`).join(' OR ');
    
    // Select the required columns. We need to be careful with SQL injections, but this script is internal so we use unsafe
    const colsToSelect = [idCol, ...imageCols].map(c => `"${c}"`).join(', ');
    
    const records = await sql.unsafe(`
      SELECT ${colsToSelect} 
      FROM ${tableName} 
      WHERE ${whereConditions} 
      LIMIT 20
    `);

    if (!records || records.length === 0) {
      break;
    }

    for (const record of records) {
      try {
        let updatedCount = 0;
        
        for (const col of imageCols) {
          const val = record[col];
          if (val && val.startsWith('data:image/')) {
            const url = await uploadBase64ToDb(val, folder, `${prefix}-${record[idCol]}`);
            
            // Execute update for this specifically
            await sql.unsafe(`UPDATE ${tableName} SET "${col}" = $1 WHERE "${idCol}" = $2`, [url, record[idCol]]);
            updatedCount++;
          }
        }
        
        if (updatedCount > 0) {
          console.log(`✅ ${tableName} ID ${record[idCol]} migrated (${updatedCount} image(s))`);
          totalProcessed++;
        }
      } catch (e: any) {
        console.error(`❌ Failed ${tableName} ID ${record[idCol]}:`, e.message);
      }
    }
  }
  
  console.log(`Completed ${tableName}: ${totalProcessed} rows migrated.`);
}

async function migrateTableImages() {
  console.log('Starting Base64 to Supabase Storage migration by batches (safe for large DBs)...');
  
  try {
    await processTableBatch('products', 'id', ['image'], 'products', 'prod');
    await processTableBatch('categories', 'id', ['image'], 'categories', 'cat');
    await processTableBatch('subcategories', 'id', ['image'], 'subcategories', 'subcat');
    await processTableBatch('sub_subcategories', 'id', ['image'], 'sub_subcategories', 'subsubcat');
    await processTableBatch('product_images', 'id', ['image'], 'product_images', 'prodimg');
    await processTableBatch('brands', 'id', ['image'], 'brands', 'brand');
    await processTableBatch('slider_images', 'id', ['image_url', 'mobile_image_url'], 'slider_images', 'slider');
    await processTableBatch('settings', 'key', ['value'], 'settings', 'setting');
    await processTableBatch('blog_posts', 'id', ['image_url'], 'blog_posts', 'blog');
    await processTableBatch('reviews', 'id', ['image_url'], 'reviews', 'review');

    console.log('\n🎉 Full Migration completed successfully!');
  } catch (err: any) {
    console.error('\n💥 Critical Error during migration:', err.message);
  }
  
  process.exit(0);
}

// Run the script
migrateTableImages().catch(console.error);
