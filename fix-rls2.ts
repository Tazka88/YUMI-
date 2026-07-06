import { sql, setupDb } from './src/db/setup.js';

async function fixRLS() {
  await setupDb();

  console.log('Enabling RLS on tables...');
  
  // Enable RLS
  await sql`ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;`;

  console.log('Dropping existing policies if any...');
  // Drop existing policies if they exist to avoid errors
  try { await sql`DROP POLICY IF EXISTS "Public can read communes" ON public.communes;`; } catch (e) {}
  try { await sql`DROP POLICY IF EXISTS "Public can read offices" ON public.offices;`; } catch (e) {}
  try { await sql`DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;`; } catch (e) {}

  console.log('Creating new policies...');
  // Communes & Offices: Public read-only
  await sql`
    CREATE POLICY "Public can read communes"
    ON public.communes FOR SELECT
    TO anon, authenticated
    USING (true);
  `;
  await sql`
    CREATE POLICY "Public can read offices"
    ON public.offices FOR SELECT
    TO anon, authenticated
    USING (true);
  `;

  // Subscribers: Insert only
  await sql`
    CREATE POLICY "Anyone can subscribe"
    ON public.subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  `;

  // email_logs: No policies for anon/authenticated (locked down to service_role)

  console.log('RLS policies applied successfully!');
  process.exit(0);
}

fixRLS().catch(err => {
  console.error(err);
  process.exit(1);
});
