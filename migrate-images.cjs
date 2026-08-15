const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');

const sql = postgres(process.env.DATABASE_URL);

let supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl.includes('https://')) {
    supabaseUrl = 'https://' + supabaseUrl.split('https://')[1].trim();
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Fetching blog posts...');
  const posts = await sql`SELECT id, title, image_url, image_1_url, image_2_url, image_3_url, content FROM blog_posts`;
  
  for (const post of posts) {
    let updated = false;
    const updates = {};
    
    for (const field of ['image_url', 'image_1_url', 'image_2_url', 'image_3_url']) {
      if (post[field] && post[field].startsWith('data:image/')) {
        console.log(`Uploading ${field} for post ${post.id}`);
        const url = await uploadBase64(post[field], post.id, field);
        if (url) {
          updates[field] = url;
          updated = true;
        }
      }
    }
    
    // Also process content HTML
    if (post.content && post.content.includes('data:image/')) {
      console.log(`Processing HTML content for post ${post.id}`);
      const newContent = await processHtml(post.content, post.id);
      if (newContent !== post.content) {
        updates.content = newContent;
        updated = true;
      }
    }
    
    if (updated) {
      console.log(`Updating post ${post.id} in DB...`);
      await sql`UPDATE blog_posts SET ${sql(updates)} WHERE id = ${post.id}`;
    }
  }
  
  console.log('Migration completed.');
  process.exit(0);
}

async function uploadBase64(base64Str, postId, fieldName) {
  try {
    const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    
    const imageType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    let ext = imageType === 'jpeg' ? 'jpg' : imageType.split('+')[0];
    const fileName = `blog/migration/post-${postId}-${fieldName}-${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, { contentType: `image/${imageType}`, upsert: true });
      
    if (error) {
      console.error('Supabase error:', error.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}

async function processHtml(html, postId) {
  const regex = /data:image\/([^;]+);base64,([a-zA-Z0-9+/=]+)/g;
  const matches = [...html.matchAll(regex)];
  
  let processedHtml = html;
  
  for (let i = 0; i < matches.length; i++) {
    const fullMatch = matches[i][0];
    const imageType = matches[i][1];
    const base64Data = matches[i][2];
    
    const buffer = Buffer.from(base64Data, 'base64');
    let ext = imageType === 'jpeg' ? 'jpg' : imageType.split('+')[0];
    const fileName = `blog/migration/post-${postId}-content-${i}-${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, { contentType: `image/${imageType}`, upsert: true });
      
    if (!error) {
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      processedHtml = processedHtml.split(fullMatch).join(publicUrlData.publicUrl);
    }
  }
  
  return processedHtml;
}

migrate().catch(console.error);
