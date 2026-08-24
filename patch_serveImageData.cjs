const fs = require('fs');

let content = fs.readFileSync('src/api/routes.ts', 'utf8');

// Change serveImageData signature and implementation
const newServeImageData = `const serveImageData = async (req: any, res: any, imageData: string, targetWidth?: number, cacheControl = 'public, max-age=31536000, immutable') => {
  let processWithSharp = async (inputBuffer, originalExt) => {
    let outputBuffer = inputBuffer;
    let ext = originalExt;
    const w = req?.query?.w || targetWidth;
    const f = req?.query?.f;
    const q = req?.query?.q;
    
    if (w || f === 'webp' || q) {
      try {
        const sharp = (await import('sharp')).default;
        let s = sharp(inputBuffer);
        if (w) {
          s = s.resize(Number(w), null, { withoutEnlargement: true });
        }
        if (f === 'webp' || ext === 'webp') {
          s = s.webp({ quality: q ? Number(q) : 80 });
          ext = 'webp';
        } else if (q) {
          if (ext === 'jpeg' || ext === 'jpg') {
            s = s.jpeg({ quality: Number(q) });
          } else if (ext === 'png') {
            s = s.png({ quality: Number(q) });
          }
        }
        outputBuffer = await s.toBuffer();
      } catch (e) {
        console.warn('Sharp processing failed:', e);
      }
    }
    return { buffer: outputBuffer, ext };
  };

  if (imageData.startsWith('data:image/')) {
    const commaIndex = imageData.indexOf(',');
    const extStart = 11;
    const extEnd = imageData.indexOf(';', extStart);
    
    if (commaIndex !== -1 && extEnd !== -1) {
      let ext = imageData.substring(extStart, extEnd);
      const base64Data = imageData.substring(commaIndex + 1);
      let buffer = Buffer.from(base64Data, 'base64');
      
      if (ext !== 'svg+xml') {
        const processed = await processWithSharp(buffer, ext);
        buffer = processed.buffer;
        ext = processed.ext;
      }
      
      res.setHeader('Content-Type', \`image/\${ext === 'svg+xml' ? 'svg+xml' : ext}\`);
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=31536000, immutable');
      res.setHeader('CDN-Cache-Control', 'max-age=31536000, immutable');
      return res.send(buffer);
    }
  }
  
  if (imageData.startsWith('http') || imageData.startsWith('https')) {
    try {
      const resp = await fetch(imageData);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        let contentType = resp.headers.get('content-type') || 'image/webp';
        let ext = contentType.split('/')[1] || 'jpeg';
        
        if (ext !== 'svg+xml') {
          const processed = await processWithSharp(buffer, ext);
          buffer = processed.buffer;
          ext = processed.ext;
          contentType = \`image/\${ext}\`;
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', cacheControl);
        res.setHeader('Vercel-CDN-Cache-Control', 'max-age=31536000, immutable');
        res.setHeader('CDN-Cache-Control', 'max-age=31536000, immutable');
        return res.send(buffer);
      } else if (resp.status === 402) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.send(\`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><path d="M150 150 L250 250 M250 150 L150 250" stroke="#d1d5db" stroke-width="4" stroke-linecap="round"/><rect width="180" height="140" x="110" y="130" fill="none" stroke="#d1d5db" stroke-width="4" rx="10"/></svg>\`);
      }
    } catch (err) {
      console.warn('Proxy fetch failed, falling back to redirect:', err);
    }
    res.setHeader('Cache-Control', cacheControl);
    return res.redirect(301, imageData);
  }
  
  if (imageData.startsWith('/')) {
    res.setHeader('Cache-Control', cacheControl);
    return res.redirect(301, imageData);
  }
  
  res.status(404).json({ error: 'Invalid image format' });
};`;

const oldServeImageDataRegex = /const serveImageData = async \(res: any, imageData: string, targetWidth\?: number, cacheControl = 'public, max-age=31536000, immutable'\) => \{[\s\S]*?\n\};\n\nconst PRODUCT_COLS/;

if (!oldServeImageDataRegex.test(content)) {
  console.log("Regex didn't match.");
  // Find where const PRODUCT_COLS starts to replace safely
  const productColsIndex = content.indexOf('const PRODUCT_COLS');
  const serveImageDataIndex = content.indexOf('const serveImageData = async');
  if (productColsIndex > -1 && serveImageDataIndex > -1) {
     content = content.substring(0, serveImageDataIndex) + newServeImageData + "\n\n" + content.substring(productColsIndex);
     console.log("Used manual substring replacement");
  }
} else {
  content = content.replace(oldServeImageDataRegex, newServeImageData + "\n\nconst PRODUCT_COLS");
}

// Now replace calls
content = content.replace(/await serveImageData\(res, imageData, width\);/g, "await serveImageData(req, res, imageData, width);");
content = content.replace(/await serveImageData\(res, imageData, width, 'public, max-age=300'\);/g, "await serveImageData(req, res, imageData, width, 'public, max-age=300');");

fs.writeFileSync('src/api/routes.ts', content);
console.log('Patched serveImageData');
