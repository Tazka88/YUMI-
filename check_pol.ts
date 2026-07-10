import { sql, setupDb } from './src/db/setup.js';
async function check() {
  await setupDb();
  const pol = await sql`SELECT * FROM pg_policies WHERE tablename = 'subscribers'`;
  console.log('policies on subscribers:\n', pol);
  
  const funcs = await sql`SELECT proname, prosecdef FROM pg_proc WHERE proname IN ('get_product_page', 'handle_new_user')`;
  console.log('functions:\n', funcs);
  process.exit(0);
}
check().catch(console.error);
