import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

function resolveConnectionString(rawUrl?: string): string {
  let url = rawUrl || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';

  // If URL uses the Supabase pooler host pattern (which may fail with :nxdomain or tenant not found)
  // or contains postgres.<project_ref>, resolve it directly to the Supabase host on port 5432
  const poolerMatch = url.match(/postgres\.([a-zA-Z0-9_-]+):([^@]+)@[^:]+:(\d+)\/([a-zA-Z0-9_]+)/);
  if (poolerMatch) {
    const [, ref, pass, , db] = poolerMatch;
    url = `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/${db}`;
  }

  // Ensure port 5432 is used for direct db.<ref>.supabase.co connections (port 6543 is pooler only)
  if (url.includes('.supabase.co:6543')) {
    url = url.replace('.supabase.co:6543', '.supabase.co:5432');
  }

  return url;
}

let connectionString = resolveConnectionString(process.env.DATABASE_URL);

export const sql = globalForPostgres.sql ?? postgres(connectionString, {
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : 'require',
  max: 30, // Higher max for local development to handle many concurrent image requests
  idle_timeout: 5, // Fast idle timeout to avoid stale connections
  connect_timeout: 15,
  prepare: false, // Required for PgBouncer transaction mode
  max_lifetime: 60 * 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.sql = sql;
}

export async function setupDb() {
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });
    
    await Promise.race([
      sql`SELECT 1`,
      timeoutPromise
    ]);
    
    clearTimeout(timer!);
    // Initialize schema
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // await sql.unsafe(schema);
    }
  } catch (error) {
    console.error('Database connection error (non-fatal):', error);
  }
}
