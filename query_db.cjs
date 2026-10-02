const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || 'postgresql://zorando_user:ZorandoPass123!@ep-wispy-water-a2o44eut-pooler.eu-central-1.aws.neon.tech/zorando_db?sslmode=require');
async function run() {
  const brands = await sql`SELECT name, slug FROM brands WHERE name ILIKE '%moulinex%'`;
  console.log(brands);
}
run();
