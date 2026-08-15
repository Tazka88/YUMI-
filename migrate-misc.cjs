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
  const brands = await sql`SELECT id, image FROM brands`;
  for (const c of brands) {
    if (c.image && c.image.startsWith('data:image/')) {
        console.log('Migrating brand', c.id);
        const matches = c.image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const imageType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            let ext = imageType === 'jpeg' ? 'jpg' : imageType.split('+')[0];
            const fileName = `brands/migration/brand-${c.id}-${Date.now()}.${ext}`;
            
            const { data, error } = await supabase.storage
              .from('images')
              .upload(fileName, buffer, { contentType: `image/${imageType}`, upsert: true });
              
            if (!error) {
              const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
              await sql`UPDATE brands SET image = ${publicUrlData.publicUrl} WHERE id = ${c.id}`;
              console.log('Updated brand', c.id);
            }
        }
    }
  }
  
  const sliders = await sql`SELECT id, image_url, mobile_image_url FROM slider_images`;
  for (const s of sliders) {
    for (const field of ['image_url', 'mobile_image_url']) {
        if (s[field] && s[field].startsWith('data:image/')) {
            console.log('Migrating slider', s.id, field);
            const matches = s[field].match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const imageType = matches[1];
                const base64Data = matches[2];
                const buffer = Buffer.from(base64Data, 'base64');
                let ext = imageType === 'jpeg' ? 'jpg' : imageType.split('+')[0];
                const fileName = `sliders/migration/slider-${s.id}-${field}-${Date.now()}.${ext}`;
                
                const { data, error } = await supabase.storage
                  .from('images')
                  .upload(fileName, buffer, { contentType: `image/${imageType}`, upsert: true });
                  
                if (!error) {
                  const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
                  await sql`UPDATE slider_images SET ${sql(field)} = ${publicUrlData.publicUrl} WHERE id = ${s.id}`;
                  console.log('Updated slider', s.id, field);
                }
            }
        }
    }
  }

  process.exit(0);
}
migrate().catch(console.error);
