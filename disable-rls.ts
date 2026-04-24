import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function disableRls() {
  try {
    const tables = [
      'users', 'categories', 'subcategories', 'sub_subcategories', 'brands', 'products',
      'product_images', 'orders', 'order_items', 'pages', 'settings',
      'slider_images', 'footer_columns', 'footer_links', 'reviews', 'wilayas'
    ];
    
    for (const table of tables) {
      console.log(`Disabling RLS on ${table}...`);
      await sql.unsafe(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }
    console.log('Successfully disabled RLS on all tables.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

disableRls();
