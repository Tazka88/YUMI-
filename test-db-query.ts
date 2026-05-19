import { sql } from './src/db/setup.js';
async function run() {
  const categories = await sql`SELECT id, name, slug FROM categories WHERE id IN (9, 27, 43)`;
  const subcategories = await sql`SELECT id, name, slug FROM subcategories WHERE id IN (9, 27, 43)`;
  const sub_subcategories = await sql`SELECT id, name, slug FROM sub_subcategories WHERE id IN (9, 27, 43)`;
  console.log('Categories:', categories);
  console.log('Subcategories:', subcategories);
  console.log('Sub-subcategories:', sub_subcategories);
  process.exit(0);
}
run();
