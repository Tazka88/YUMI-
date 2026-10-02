import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

function resolveConnectionString(rawUrl?: string): string {
  const poolerUrl = 'postgresql://postgres.evvbhalgyffagsesmvhu:Lifebook88855@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
  let url = rawUrl || poolerUrl;

  // db.<ref>.supabase.co is IPv6-only and causes "getaddrinfo ENOTFOUND" in environments without IPv6 (like Vercel serverless)
  if (url.includes('db.evvbhalgyffagsesmvhu.supabase.co')) {
    url = poolerUrl;
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
