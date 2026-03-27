import { sql } from './src/db/setup.js';

async function run() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id VARCHAR(50) UNIQUE`;
    
    // Update existing orders to have an order_id
    const orders = await sql`SELECT id FROM orders WHERE order_id IS NULL`;
    for (const order of orders) {
      const orderIdStr = `CMD-${1000 + order.id}`;
      await sql`UPDATE orders SET order_id = ${orderIdStr} WHERE id = ${order.id}`;
    }
    console.log('Migration done');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
