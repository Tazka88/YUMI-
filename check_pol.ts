import { sql, setupDb } from './src/db/setup.js';

async function check() {
  await setupDb();
  
  const pol = await sql`SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE qual = 'true' OR with_check = 'true'`;
  console.log('policies with true:\n', pol);
  
  process.exit(0);
}

check().catch(console.error);
