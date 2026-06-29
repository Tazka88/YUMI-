import { sql, setupDb } from './src/db/setup.js';
async function test() {
  await setupDb();
  const v1 = await sql`SELECT ('"[]"'::jsonb#>>'{}')::jsonb as v1, ('[{"a":1}]'::jsonb#>>'{}')::jsonb as v2`;
  console.log(v1);
  process.exit(0);
}
test();
