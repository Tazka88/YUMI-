const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

async function test() {
  const categories = await sql`SELECT slug, name FROM categories LIMIT 2`;
  const subcats = await sql`SELECT slug, name, category_id FROM subcategories LIMIT 2`;
  const subsubcats = await sql`SELECT slug, name, subcategory_id FROM sub_subcategories LIMIT 2`;

  console.log("Categories:", categories);
  console.log("Subcats:", subcats);
  console.log("Subsubcats:", subsubcats);
  process.exit(0);
}
test();
