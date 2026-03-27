import { sql } from './src/db/setup.js';
async function main() {
  await sql`UPDATE categories SET image = null WHERE image LIKE '%unsplash%'`;
  await sql`UPDATE subcategories SET image = null WHERE image LIKE '%unsplash%'`;
  console.log("Updated categories and subcategories");
  process.exit(0);
}
main();
