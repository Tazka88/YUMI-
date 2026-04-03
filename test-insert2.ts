import { sql, setupDb } from './src/db/setup.ts';

async function test() {
  await setupDb();
  try {
    const subcategory_id = "1";
    const name = "Test 2";
    const slug = "test-2";
    const image = null;
    const [info] = await sql`INSERT INTO sub_subcategories (subcategory_id, name, slug, image) VALUES (${subcategory_id || null}, ${name || ''}, ${slug || ''}, ${image || null}) RETURNING id`;
    console.log('Success:', info);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
