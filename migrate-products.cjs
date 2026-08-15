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
  console.log('Fetching products...');
  const products = await sql`SELECT id, image FROM products`;
  let count = 0;
  for (const p of products) {
    if (p.image && p.image.startsWith('data:image/')) {
      console.log(`Product ${p.id} has base64 image!`);
      // upload base64
      count++;
    }
  }
  console.log(`Found ${count} products with base64 images.`);
  process.exit(0);
}
migrate().catch(console.error);
