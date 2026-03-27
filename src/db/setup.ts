import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for Supabase connection pooler (Supavisor)
});

export async function setupDb() {
  try {
    await sql`SELECT 1`;
    console.log('Connected to Supabase PostgreSQL successfully.');
    
    // Initialize schema
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await sql.unsafe(schema);
      console.log('Database schema initialized successfully.');
    }
  } catch (error) {
    console.error('Failed to connect to Supabase or initialize schema:', error);
  }
}
