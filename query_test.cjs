const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    const res = await pool.query(`SELECT slug, price, promo_price, promo_price_start_date, promo_price_end_date, is_active FROM products LIMIT 3`);
    console.log(res.rows);
    
    // Check variant columns
    const columns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name IN ('color', 'size', 'variants')
    `);
    console.log("Variant columns in products table:", columns.rows);
    process.exit(0);
}
check();
