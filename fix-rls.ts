import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function fix() {
  try {
    const tables = [
      'users', 'categories', 'subcategories', 'brands', 'products',
      'product_images', 'orders', 'order_items', 'pages', 'settings',
      'slides', 'footer_columns', 'footer_links', 'reviews', 'wilayas'
    ];
    
    for (const table of tables) {
      console.log(`Enabling RLS on ${table}...`);
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }
    console.log('Successfully enabled RLS on all tables.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

fix();
