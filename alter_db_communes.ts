import { sql } from './src/db/setup.js';
import { ALGERIA_COMMUNES } from './src/utils/communes.js';

async function main() {
  console.log('Creating communes table...');
  await sql`
    CREATE TABLE IF NOT EXISTS communes (
      id SERIAL PRIMARY KEY,
      wilaya VARCHAR(10) NOT NULL,
      name VARCHAR(255) NOT NULL
    );
  `;

  const [{ count }] = await sql`SELECT COUNT(*) FROM communes`;
  if (parseInt(count) === 0) {
    console.log('Populating communes...');
    for (const [wilaya, communes] of Object.entries(ALGERIA_COMMUNES)) {
      for (const name of communes) {
        await sql`INSERT INTO communes (wilaya, name) VALUES (${wilaya}, ${name})`;
      }
    }
  }
  console.log('Done.');
  process.exit(0);
}
main().catch(console.error);
