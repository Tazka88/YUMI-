import { sql } from './src/db/setup.js';
async function test() {
  console.log("Testing...");
  const start = Date.now();
  const [res] = await sql`SELECT count(*) FROM products`;
  console.log("Count:", res.count, "Time:", Date.now() - start, "ms");
  process.exit(0);
}
test();
