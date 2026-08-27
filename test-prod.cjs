const { sql } = require('./src/db/setup.js');
async function test() {
  const [product] = await sql`SELECT slug FROM products LIMIT 1`;
  console.log(product.slug);
  process.exit(0);
}
test();
