import { sql } from './src/db/setup.ts';

async function run() {
  const sliders = await sql`SELECT id, length(image_url) as l_img, length(mobile_image_url) as l_mobile FROM slider_images`;
  console.log("Slider Images:", sliders);
  
  const cats = await sql`SELECT id, name, length(image) as l_img, length(slide_image) as l_slide, length(mobile_slide_image) as l_mslide FROM categories`;
  console.log("Categories (> 500 chars):", cats.filter(c => c.l_img > 500 || c.l_slide > 500 || c.l_mslide > 500));
  
  process.exit(0);
}

run();
