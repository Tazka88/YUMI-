import { sql, setupDb } from './src/db/setup.js';
async function check() {
  await setupDb();
  const perms = await sql`
    SELECT proname, proacl 
    FROM pg_proc 
    WHERE proname IN ('get_product_page', 'handle_new_user')
  `;
  console.log(perms);
  process.exit(0);
}
check().catch(console.error);
