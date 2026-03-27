import { sql } from './src/db/setup.js';
async function main() {
  const wilayas = await sql`SELECT * FROM wilayas`;
  console.log(wilayas);
  process.exit(0);
}
main();
