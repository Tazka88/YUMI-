import { sql } from './src/db/setup.js';

async function backfillSkus() {
  try {
    console.log('Backfilling SKUs...');
    await sql`
      UPDATE products 
      SET sku = 'PROD-' || LPAD(id::text, 5, '0') 
      WHERE sku IS NULL OR sku = '' OR sku NOT LIKE 'PROD-%';
    `;
    console.log('SKUs backfilled successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling SKUs:', error);
    process.exit(1);
  }
}

backfillSkus();
