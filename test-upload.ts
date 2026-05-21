import { getSupabase } from './src/lib/supabase.js';
import fs from 'fs';

async function test() {
  const supabase = getSupabase();
  if (supabase) {
    console.log('Using supabase');
    const ext = 'webp';
    let buffer = fs.readFileSync('package.json');
    try {
      const sharp = (await import('sharp')).default;
      buffer = await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
        
      const fileName = `reviews/test-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, buffer, { contentType: 'image/webp' });
      if (error) {
        console.error('Supabase upload error:', error);
      } else {
        console.log('Uploaded successfully', data);
      }
    } catch (e) {
      console.error('Exception during upload', e);
    }
  } else {
    console.log('No supabase');
  }
}
test();
