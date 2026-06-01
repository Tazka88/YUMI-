import { sql } from './src/db/setup.js';
async function run() {
  try {
    const result = await sql`SELECT * FROM landing_pages`;
    console.log(result);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
