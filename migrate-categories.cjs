const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function check() {
  const cats = await sql`SELECT id, image FROM categories`;
  let count = 0;
  for (const c of cats) {
    if (c.image && c.image.startsWith('data:image/')) count++;
  }
  console.log(`Found ${count} categories with base64 images.`);
  process.exit(0);
}
check();
