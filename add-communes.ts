import postgres from 'postgres';
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  await sql`ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS communes TEXT`;
  console.log('Done');
  process.exit(0);
}
run();
