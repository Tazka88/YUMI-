import { sql } from './src/db/setup.js';

async function run() {
  const dups = await sql`
    SELECT name, slug, id, is_active
    FROM products
    WHERE name ILIKE '%hoco%w45%' OR name ILIKE '%mi%band%10%';
  `;
  console.log("Found:", dups);
  process.exit(0);
}
run();
