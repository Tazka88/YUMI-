import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres', { ssl: 'require', prepare: false });

async function explore() {
  try {
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('--- TABLES ---');
    console.log(tables.map(t => t.table_name).join(', '));

    // Check RLS policies
    const policies = await sql`
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `;
    console.log('\n--- RLS POLICIES ---');
    console.log(JSON.stringify(policies, null, 2));

    // Check foreign keys
    const fks = await sql`
      SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `;
    console.log('\n--- FOREIGN KEYS ---');
    console.log(JSON.stringify(fks, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

explore();
