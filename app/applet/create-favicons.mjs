import fs from 'fs';
import sharp from 'sharp';

async function generate() {
  const svgBuffer = fs.readFileSync('public/favicon-zorando.svg');
  
  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/favicon-zorando-192x192.png');
    
  // 32x32 PNG
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-zorando-32x32.png');

  // 16x16 PNG (Optional but requested maybe? User just said replace favicons)
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile('public/favicon-zorando-16x16.png');
    
  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/favicon-zorando-512x512.png');

  // For favicon.ico, we can just use the 32x32 buffer directly or use an external package if needed. Let's just create public/favicon.ico as a copy of 32x32 PNG, it works in modern browsers. But truly, we can just save it over the ico.
  const buffer32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();
    
  // A crude way to replace the ICO is just dropping a 32x32 PNG as .ico (modern browsers accept it) but proper .ico format requires a small header. Let's just do it directly.
  fs.writeFileSync('public/favicon.ico', buffer32);

  console.log('Favicons generated successfully.');
}

generate().catch(console.error);
