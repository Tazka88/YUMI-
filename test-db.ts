import { sql } from './src/db/setup';
async function test() {
  try {
    const res = await sql`SELECT 1`;
    console.log('DB ok', res);
    process.exit(0);
  } catch (e) {
    console.error('DB error', e);
    process.exit(1);
  }
}
test();
