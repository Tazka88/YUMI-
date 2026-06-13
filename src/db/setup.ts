import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

// Only apply Supavisor port swap if it's a Supabase-like URL on port 5432
if (connectionString.includes('supabase.co:5432')) {
  connectionString = connectionString.replace(':5432', ':6543');
}

console.log('Initializing PostgreSQL connection...');

export const sql = postgres(connectionString, {
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : 'require',
  max: 15,
  idle_timeout: 5,
  connect_timeout: 15, // Increased timeout
  prepare: false,
});

export async function setupDb() {
  try {
    console.log('Testing database connection...');
    // Add a race to avoid hanging forever on startup
    const result = await Promise.race([
      sql`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 10000))
    ]);
    
    if (result) {
      console.log('Connected to PostgreSQL successfully.');
    }
    
    // Initialize schema if not exists
    const [{ exists }] = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    );`;

    if (!exists) {
      const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await sql.unsafe(schema);
        console.log('Database schema initialized successfully.');
      }
    } else {
      console.log('Database schema already initialized. Skipping.');
    }
  } catch (error) {
    console.error('Failed to connect to Supabase or initialize schema:', error);
  }
}
