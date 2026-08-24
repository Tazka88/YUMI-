require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  try {
    const res = await sql`SELECT id, image_url, mobile_image_url FROM slider_images LIMIT 2;`;
    console.log(res);
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
}
run();
