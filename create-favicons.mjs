import fs from 'fs';
import sharp from 'sharp';

async function generate() {
  const svgBuffer = fs.readFileSync('public/favicon-zorando.svg');
  
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/favicon-zorando-192x192.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon-zorando-32x32.png');
  await sharp(svgBuffer).resize(16, 16).png().toFile('public/favicon-zorando-16x16.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/favicon-zorando-512x512.png');
  const buffer32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', buffer32);
}
generate().catch(console.error);
