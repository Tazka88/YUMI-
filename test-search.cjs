const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const search = "kemei 2299";
  const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);
  
  let searchCondition = sql`true`;
  if (searchWords.length > 0) {
    const conditions = searchWords.map(word => sql`p.name ILIKE ${'%' + word + '%'}`);
    // Combine conditions with AND
    searchCondition = sql`${conditions.reduce((acc, curr) => sql`${acc} AND ${curr}`)}`;
  }
  
  const q = await sql`
    SELECT id, name FROM products p
    WHERE p.is_active = true AND (${searchCondition})
    LIMIT 5
  `;
  console.log(q);
  process.exit(0);
}
run();
