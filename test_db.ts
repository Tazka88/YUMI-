import { sql } from './src/db/setup.js';

async function test() {
  try {
    const slug = 'ecouteurs-sans-fil-hoco-eq8-pure-joy';
    const [product] = await sql`SELECT * FROM products WHERE slug = ${slug}`;
    console.log(product);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
