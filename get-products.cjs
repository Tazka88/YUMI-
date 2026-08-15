const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function getSlugs() {
  const products = await sql`SELECT slug, name, price, promo_price FROM products LIMIT 10`;
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}
getSlugs();
