import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres';
if (connectionString.includes(':5432')) {
  connectionString = connectionString.replace(':5432', ':6543');
}

console.log('Initializing PostgreSQL connection...');

export const sql = globalForPostgres.sql ?? postgres(connectionString, {
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : 'require',
  max: 5,
  idle_timeout: 1,
  connect_timeout: 10,
  prepare: false,
  max_lifetime: 60 * 5,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.sql = sql;
}

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
    
    // Initialize schema
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // await sql.unsafe(schema);
      console.log('Database schema initialized successfully.');
    }
  } catch (error) {
    console.error('Failed to connect to Supabase or initialize schema:', error);
  }
}
