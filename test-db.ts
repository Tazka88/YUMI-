import { sql, setupDb } from './src/db/setup.ts';

async function test() {
  await setupDb();
  try {
    const categories = await sql`SELECT * FROM categories`;
    console.log('Categories:', categories.length);
    const subcategories = await sql`SELECT * FROM subcategories`;
    console.log('Subcategories:', subcategories.length);
    const sub_subcategories = await sql`SELECT * FROM sub_subcategories`;
    console.log('Sub-subcategories:', sub_subcategories.length);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
