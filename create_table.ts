import { sql } from './src/db/setup.js';
async function run() {
  try {
    await sql.unsafe(`
CREATE TABLE IF NOT EXISTS landing_pages (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON landing_pages;
CREATE POLICY "Enable read access for all users" ON landing_pages FOR SELECT USING (true);
    `);
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
