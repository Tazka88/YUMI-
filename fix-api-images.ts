import { sql } from './src/db/setup';

async function run() {
  const tables = ['products', 'categories', 'subcategories', 'sub_subcategories', 'brands', 'product_images', 'settings', 'slider_images', 'reviews'];
  for (const table of tables) {
     const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${table}`;
     const colNames = cols.map(c => c.column_name);
     const imageCols = colNames.filter(c => c.includes('image') || c === 'value');
     if (imageCols.length === 0) continue;
     
     for (const col of imageCols) {
        const corrupted = await sql.unsafe(`SELECT id FROM ${table} WHERE ${col} LIKE '/api/images/%'`);
        if (corrupted.length > 0) {
            console.log(`Table ${table} has ${corrupted.length} corrupted ${col}`);
        }
     }
  }
}
run();
