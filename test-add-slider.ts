import { sql } from './src/db/setup.js';

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS slider_images (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('slider_images table created');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
