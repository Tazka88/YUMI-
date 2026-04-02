import { sql } from './src/db/setup.js';

async function fixBrands() {
  try {
    const brands = await sql`SELECT id, name FROM brands`;
    console.log(`Found ${brands.length} brands`);
    
    for (const brand of brands) {
      const result = await sql`
        UPDATE products 
        SET brand_id = ${brand.id} 
        WHERE brand_name ILIKE ${brand.name} AND brand_id IS NULL
      `;
      console.log(`Updated ${result.count} products for brand ${brand.name}`);
    }
    console.log('Done fixing brands');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixBrands();
