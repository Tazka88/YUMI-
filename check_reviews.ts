import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function run() {
  const result = await sql`SELECT count(*) FROM reviews`;
  console.log('Total reviews:', result[0].count);
  
  const multismart = await sql`
    SELECT count(r.id) 
    FROM reviews r 
    JOIN products p ON r.product_id = p.id 
    JOIN brands b ON p.brand_id = b.id 
    WHERE lower(b.name) = 'multismart'
  `;
  console.log('Total multismart reviews:', multismart[0].count);
  process.exit(0);
}
run();
