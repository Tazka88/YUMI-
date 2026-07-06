import { sql, setupDb } from './src/db/setup.js';

async function check() {
  await setupDb();
  
  const fn1 = await sql`SELECT pg_get_functiondef('public.get_product_page'::regproc)`;
  console.log('get_product_page:\n', fn1[0].pg_get_functiondef);

  const fn2 = await sql`SELECT pg_get_functiondef('public.handle_new_user'::regproc)`;
  console.log('handle_new_user:\n', fn2[0].pg_get_functiondef);

  const pol = await sql`SELECT * FROM pg_policies WHERE tablename = 'subscribers'`;
  console.log('policies subscribers:\n', pol);
  
  process.exit(0);
}

check().catch(console.error);
