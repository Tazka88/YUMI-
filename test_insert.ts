import { sql } from './src/db/setup.js';
async function test() {
  const [product] = await sql`SELECT id, name FROM products LIMIT 1`;
  if (product) {
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const [lp] = await sql`INSERT INTO landing_pages (product_id, slug, config) VALUES (${product.id}, ${slug}, '{}') RETURNING *`;
    console.log("Created:", lp);
  } else {
    console.log("No products");
  }
  process.exit();
}
test();
