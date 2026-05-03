import { sql } from './src/db/setup.ts';

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS offices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        wilaya VARCHAR(255) NOT NULL,
        commune VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Offices table created');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
