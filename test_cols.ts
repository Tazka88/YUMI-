import { sql } from './src/db/setup.js';
async function run() {
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`;
    console.log(res);
    process.exit();
}
run();
