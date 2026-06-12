import { sql } from '../src/db/setup.js';

async function fixPerformance() {
  console.log('Adding performance indexes to prevent Seq Scans and reduce Disk IO...');
  
  try {
    // We add them CONCURRENTLY to avoid locking the table
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON products(slug);`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category_id);`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand ON products(brand_id);`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_popular ON products(is_popular) WHERE is_popular = true;`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_best_sel ON products(is_best_seller) WHERE is_best_seller = true;`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = true;`;
    await sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;`;

    console.log('✅ All indexes created successfully!');
  } catch (err) {
    console.error('Error creating indexes:', err);
  }
  process.exit(0);
}

fixPerformance();
