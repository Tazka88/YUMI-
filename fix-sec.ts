import { sql, setupDb } from './src/db/setup.js';

async function fixSec() {
  await setupDb();
  
  // 1. search_path on get_product_page
  console.log('Setting search_path on get_product_page...');
  await sql`ALTER FUNCTION public.get_product_page(text) SET search_path = public;`;

  // 2. Revoke execute from public
  console.log('Revoking EXECUTE from public for functions...');
  await sql`REVOKE EXECUTE ON FUNCTION public.get_product_page(text) FROM public;`;
  await sql`REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;`;

  // 3. Grant execute to appropriate roles for get_product_page
  console.log('Granting EXECUTE on get_product_page to anon, authenticated, service_role...');
  await sql`GRANT EXECUTE ON FUNCTION public.get_product_page(text) TO anon, authenticated, service_role;`;

  console.log('Security fixes applied!');
  process.exit(0);
}

fixSec().catch(err => {
  console.error(err);
  process.exit(1);
});
