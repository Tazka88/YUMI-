import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

function resolveConnectionString(rawUrl?: string): string {
  const poolerUrl = 'postgresql://postgres.evvbhalgyffagsesmvhu:Lifebook88855@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
  if (
    !rawUrl ||
    typeof rawUrl !== 'string' ||
    rawUrl.trim() === '' ||
    rawUrl.trim() === 'undefined' ||
    rawUrl.trim() === 'null' ||
    !rawUrl.trim().startsWith('postgres') ||
    rawUrl.includes('YOUR_PROJECT_ID') ||
    rawUrl.includes('YOUR_PASSWORD') ||
    rawUrl.includes('db.evvbhalgyffagsesmvhu.supabase.co')
  ) {
    return poolerUrl;
  }

  return rawUrl.trim();
}

let connectionString = resolveConnectionString(process.env.DATABASE_URL);

export const sql = globalForPostgres.sql ?? postgres(connectionString, {
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : 'require',
  max: isServerless ? 5 : 10, // Prevent Supabase pooler exhaustion
  idle_timeout: isServerless ? 15 : 30, // Proactively close idle sockets
  connect_timeout: 20, // 20s connection timeout to accommodate PgBouncer/Supavisor latency spikes
  prepare: false, // Required for PgBouncer / Supavisor transaction mode
  max_lifetime: 60 * 3, // Recycle connections every 3 minutes
  backoff: (attempts) => Math.min(0.2 * Math.pow(2, attempts), 2),
});

// Cache on globalThis across all environments (including production serverless lambdas)
globalForPostgres.sql = sql;

export async function setupDb() {
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Database connection timeout')), 5000);
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
