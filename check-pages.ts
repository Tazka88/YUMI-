import { sql } from './src/db/setup.ts';
async function run() {
  const pages = await sql`SELECT title, slug FROM pages`;
  console.log('--- PAGES IN DATABASE ---');
  console.table(pages);
  process.exit(0);
}
run();
