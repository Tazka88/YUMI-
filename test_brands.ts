import { sql } from './src/db/setup.js';
async function test() {
  const b = await sql`SELECT slug FROM brands WHERE slug = 'bestway' OR slug = 'piscines-bestway-algerie'`;
  console.log(b);
  process.exit(0);
}
test();
