const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const url = (process.env.SUPABASE_URL || '').replace(/.*https/, 'https').trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function fixFiles(bucket, path = '') {
  const { data: items, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
  if (error) {
    console.error(`Error listing ${bucket}/${path}:`, error);
    return;
  }
  if (!items) return;

  for (const item of items) {
    if (item.id === null) {
      // It's a folder
      await fixFiles(bucket, path ? `${path}/${item.name}` : item.name);
    } else {
      if (item.name === '.emptyFolderPlaceholder') continue;
      
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.metadata && item.metadata.cacheControl === 'max-age=3600') {
        console.log(`Updating ${fullPath}...`);
        
        // Download
        const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(fullPath);
        if (downloadError) {
          console.error(`  -> Failed to download:`, downloadError);
          continue;
        }
        
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload with new cacheControl
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fullPath, buffer, {
          cacheControl: 'public, max-age=31536000, immutable',
          upsert: true,
          contentType: item.metadata.mimetype
        });
        
        if (uploadError) {
          console.error(`  -> Failed to upload:`, uploadError);
        } else {
          console.log(`  -> Successfully updated!`);
        }
      }
    }
  }
}

async function run() {
  console.log("Starting cache-control fix...");
  await fixFiles('images');
  console.log("Done.");
}

run();
