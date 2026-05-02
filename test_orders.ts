import { sql } from './src/db/setup.ts';

async function run() {
  const rs = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 1`;
  console.log(rs);
  process.exit(0);
}
run();
