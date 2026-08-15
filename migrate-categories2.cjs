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
  const cats = await sql`SELECT id, image FROM categories`;
  for (const c of cats) {
    if (c.image && c.image.startsWith('data:image/')) {
        console.log('Migrating category', c.id);
        const matches = c.image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const imageType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            let ext = imageType === 'jpeg' ? 'jpg' : imageType.split('+')[0];
            const fileName = `categories/migration/cat-${c.id}-${Date.now()}.${ext}`;
            
            const { data, error } = await supabase.storage
              .from('images')
              .upload(fileName, buffer, { contentType: `image/${imageType}`, upsert: true });
              
            if (!error) {
              const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
              await sql`UPDATE categories SET image = ${publicUrlData.publicUrl} WHERE id = ${c.id}`;
              console.log('Updated category', c.id);
            }
        }
    }
  }
  process.exit(0);
}
migrate().catch(console.error);
