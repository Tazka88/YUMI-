import { sql } from './src/db/setup.js';

async function main() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS faq_q1 VARCHAR(255);`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS faq_a1 TEXT;`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS faq_q2 VARCHAR(255);`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS faq_a2 TEXT;`;
    console.log("Added FAQ columns to products table");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
