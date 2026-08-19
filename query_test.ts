import { sql } from './src/db/setup.js';
async function check() {
    const res = await sql`SELECT slug, price, promo_price, promo_price_start_date, promo_price_end_date, is_active FROM products LIMIT 3`;
    console.log(res);
    
    // Check variant columns
    const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name IN ('color', 'size', 'variants', 'options')
    `;
    console.log("Variant columns in products table:", columns);
    
    // Check variants table
    const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name='variants' OR table_name='product_variants'
    `;
    console.log("Variant tables:", tables);
    
    process.exit(0);
}
check();
