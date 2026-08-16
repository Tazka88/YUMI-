const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'blog_posts'`;
  console.log(cols.map(c => c.column_name));
  process.exit(0);
}
run();
