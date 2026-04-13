import { sql } from './src/db/setup.js';
async function run() {
  const products = await sql`SELECT id, name, image FROM products LIMIT 5`;
  console.log(products);
  process.exit(0);
}
run();
