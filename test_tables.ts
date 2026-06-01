import { sql } from './src/db/setup.js';
async function run() {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(res);
    process.exit();
}
run();
