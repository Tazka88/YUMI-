import { sql } from './src/db/setup.ts';

async function run() {
  const sliders = await sql`SELECT id, image_url, mobile_image_url FROM slider_images`;
  console.log("Slider Images:");
  sliders.forEach(s => {
    console.log(`- ID ${s.id}:`);
    console.log(`  Img: ${s.image_url ? s.image_url.substring(0, 30) + '...' : 'null'}`);
    console.log(`  Mob: ${s.mobile_image_url ? s.mobile_image_url.substring(0, 30) + '...' : 'null'}`);
  });
  
  const cats = await sql`SELECT id, name, image, slide_image, mobile_slide_image FROM categories`;
  console.log("Categories:");
  cats.forEach(c => {
    console.log(`- ID ${c.id} (${c.name}):`);
    console.log(`  Img: ${c.image ? c.image.substring(0, 30) + '...' : 'null'}`);
    console.log(`  Slide: ${c.slide_image ? c.slide_image.substring(0, 30) + '...' : 'null'}`);
    console.log(`  MSlide: ${c.mobile_slide_image ? c.mobile_slide_image.substring(0, 30) + '...' : 'null'}`);
  });
  
  process.exit(0);
}

run();
