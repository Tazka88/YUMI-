import { sql, setupDb } from './src/db/setup.js';
async function fix() {
  await setupDb();
  
  // Revoke execute on get_product_page from anon, authenticated, public
  try { await sql`REVOKE EXECUTE ON FUNCTION public.get_product_page(text) FROM public;`; } catch (e) {}
  try { await sql`REVOKE EXECUTE ON FUNCTION public.get_product_page(text) FROM anon;`; } catch (e) {}
  try { await sql`REVOKE EXECUTE ON FUNCTION public.get_product_page(text) FROM authenticated;`; } catch (e) {}

  console.log('Done!');
  process.exit(0);
}
fix().catch(console.error);
