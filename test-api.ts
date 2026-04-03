import { sql, setupDb } from './src/db/setup.ts';

async function test() {
  await setupDb();
  try {
    const categories = await sql`SELECT * FROM categories`;
    const subcategories = await sql`SELECT * FROM subcategories`;
    const sub_subcategories = await sql`SELECT * FROM sub_subcategories`;
    
    const categoriesWithSubcats = categories.map((cat: any) => ({
      ...cat,
      subcategories: subcategories.filter((sub: any) => sub.category_id?.toString() === cat.id?.toString()).map((sub: any) => ({
        ...sub,
        sub_subcategories: sub_subcategories.filter((ss: any) => ss.subcategory_id?.toString() === sub.id?.toString())
      }))
    }));
    
    console.log(JSON.stringify(categoriesWithSubcats, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
