import { sql } from './src/db/setup.js';

async function updateDb() {
  try {
    console.log('Adding mobile_slide_image to categories...');
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS mobile_slide_image TEXT;`;
    console.log('Adding mobile_image_url to slider_images...');
    await sql`ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;`;
    console.log('Database updated successfully.');
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

updateDb();
