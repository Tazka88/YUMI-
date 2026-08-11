const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const processFunction = `
async function processBase64ImagesInHtml(html) {
  if (!html) return html;
  
  const regex = /data:image\\/([^;]+);base64,([a-zA-Z0-9+/=]+)/g;
  const matches = [...html.matchAll(regex)];
  
  if (matches.length === 0) return html;
  
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase non configuré, impossible de traiter les images Base64.');
    return html;
  }
  
  let processedHtml = html;
  
  for (const match of matches) {
    const fullMatch = match[0];
    const imageType = match[1];
    const base64Data = match[2];
    
    try {
      let buffer = Buffer.from(base64Data, 'base64');
      let contentType = \`image/\${imageType}\`;
      let ext = imageType === 'jpeg' ? 'jpg' : imageType;
      
      if (imageType !== 'svg+xml') {
        try {
          const sharp = (await import('sharp')).default;
          buffer = await sharp(buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          contentType = 'image/webp';
          ext = 'webp';
        } catch (sharpError) {
          console.warn('Sharp compression failed for inline image, using original:', sharpError);
        }
      }
      
      const { error: bucketError } = await supabase.storage.getBucket('images');
      if (bucketError && (bucketError.message.includes('not found') || bucketError.message.includes('does not exist'))) {
        await supabase.storage.createBucket('images', { public: true });
      }
      
      const uniqueId = Math.random().toString(36).substring(7);
      const fileName = \`blog/html/\${Date.now()}-\${uniqueId}.\${ext}\`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      
      processedHtml = processedHtml.split(fullMatch).join(publicUrlData.publicUrl);
    } catch (err) {
      console.error('Erreur lors du traitement de l\\'image Base64:', err);
      throw new Error('Échec du traitement d\\'une image dans le contenu HTML.');
    }
  }
  
  return processedHtml;
}

router.post('/admin/blog/posts', authenticate, async (req, res) => {`;

code = code.replace("router.post('/admin/blog/posts', authenticate, async (req, res) => {", processFunction);

const oldVars = "const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt, main_image_alt } = req.body;";
const newVars = `let { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, image_1_url, image_1_alt, image_2_url, image_2_alt, image_3_url, image_3_alt, main_image_alt } = req.body;
    content = await processBase64ImagesInHtml(content);`;

// There are two occurrences of this line (POST and PUT)
code = code.replaceAll(oldVars, newVars);

fs.writeFileSync('src/api/routes.ts', code);
