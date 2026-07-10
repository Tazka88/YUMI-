import { sql, setupDb } from './src/db/setup.js';
async function fix() {
  await setupDb();
  
  // 1. get_product_page -> SECURITY INVOKER
  console.log('Changing get_product_page to SECURITY INVOKER...');
  await sql`ALTER FUNCTION public.get_product_page(text) SECURITY INVOKER;`;
  
  // 2. handle_new_user -> Revoke execute
  console.log('Revoking execute on handle_new_user from anon, authenticated, public...');
  try { await sql`REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;`; } catch (e) {}
  try { await sql`REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;`; } catch (e) {}
  try { await sql`REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;`; } catch (e) {}

  // 3. subscribers policy
  console.log('Updating subscribers policy...');
  try { await sql`DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;`; } catch(e) {}
  
  await sql`
    CREATE POLICY "Anyone can subscribe"
    ON public.subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (email IS NOT NULL);
  `;
  
  console.log('Done!');
  process.exit(0);
}
fix().catch(console.error);
