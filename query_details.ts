import { sql } from './src/db/setup.js';

async function run() {
  const hoco = await sql`SELECT id, name, slug, created_at FROM products WHERE id IN (15, 19)`;
  const mi = await sql`SELECT id, name, slug, created_at FROM products WHERE id IN (179, 316)`;
  
  const orderItems = await sql`SELECT product_id, COUNT(*) as count FROM order_items WHERE product_id IN (15, 19, 179, 316) GROUP BY product_id`;
  const reviews = await sql`SELECT product_id, COUNT(*) as count FROM reviews WHERE product_id IN (15, 19, 179, 316) GROUP BY product_id`;
  
  console.log("Hoco:", hoco);
  console.log("Mi:", mi);
  console.log("Orders:", orderItems);
  console.log("Reviews:", reviews);
  process.exit(0);
}
run();
