const postgres = require('postgres');
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres', { ssl: 'require' });

(async () => {
  const [product] = await sql`SELECT id, name FROM products WHERE slug = 'kemei-km-2299-10w-hair-trimmer-professionnelle-coupe-ultra-precise-zero-gap-7500-rpm-sans-fil'`;
  if (!product) {
    console.log("Product not found");
    process.exit(0);
  }
  console.log("Product:", product);
  const reviews = await sql`SELECT * FROM reviews WHERE product_id = ${product.id}`;
  console.log("Reviews count:", reviews.length);
  process.exit(0);
})();
