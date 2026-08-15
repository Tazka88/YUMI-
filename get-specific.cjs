const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function getSpecific() {
  const noPromo = await sql`SELECT slug, price FROM products WHERE promo_price IS NULL LIMIT 1`;
  const outOfStock = await sql`SELECT slug, stock FROM products WHERE stock <= 0 LIMIT 1`;
  console.log("No Promo:", noPromo);
  console.log("Out of Stock:", outOfStock);
  process.exit(0);
}
getSpecific();
