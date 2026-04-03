import { sql, setupDb } from './src/db/setup.ts';

async function test() {
  await setupDb();
  try {
    const [info] = await sql`INSERT INTO sub_subcategories (subcategory_id, name, slug, image) VALUES (1, 'Test', 'test', null) RETURNING id`;
    console.log('Success:', info);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
