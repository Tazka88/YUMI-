import { sql } from './src/db/setup';
import { getSupabase } from './src/lib/supabase';

async function run() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error("No supabase configured");
    return;
  }

  const posts = await sql`SELECT id, image_url, image_1_url, image_2_url, image_3_url FROM blog_posts`;
  
  for (const post of posts) {
    let updated = false;
    const updates: any = {};
    
    const fields = ['image_url', 'image_1_url', 'image_2_url', 'image_3_url'];
    
    for (const field of fields) {
      const val = post[field];
      if (val && typeof val === 'string' && val.startsWith('data:image/')) {
        console.log(`Migrating post ${post.id} field ${field}...`);
        try {
          const base64Data = val.split(';base64,').pop();
          const extMatch = val.match(/^data:image\/([a-zA-Z0-9]+);/);
          const ext = extMatch ? extMatch[1] : 'png';
          
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `uploads/migrated-${post.id}-${field}-${Date.now()}.${ext}`;
          
          const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, buffer, {
              contentType: `image/${ext}`,
              upsert: false
            });
            
          if (error) throw error;
          
          const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
          updates[field] = publicUrlData.publicUrl;
          updated = true;
          console.log(`Success: ${publicUrlData.publicUrl}`);
        } catch (e) {
          console.error(`Failed to migrate ${field} for post ${post.id}:`, e.message);
        }
      }
    }
    
    if (updated) {
      if (updates.image_url) await sql`UPDATE blog_posts SET image_url = ${updates.image_url} WHERE id = ${post.id}`;
      if (updates.image_1_url) await sql`UPDATE blog_posts SET image_1_url = ${updates.image_1_url} WHERE id = ${post.id}`;
      if (updates.image_2_url) await sql`UPDATE blog_posts SET image_2_url = ${updates.image_2_url} WHERE id = ${post.id}`;
      if (updates.image_3_url) await sql`UPDATE blog_posts SET image_3_url = ${updates.image_3_url} WHERE id = ${post.id}`;
      console.log(`Updated post ${post.id} in DB.`);
    }
  }
  console.log("Done.");
}
run();
