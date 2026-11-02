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
  connect_timeout: 15, // Headroom for Supabase pooler TLS handshake & cold start
  prepare: false, // Required for PgBouncer / Supavisor transaction mode
  max_lifetime: 60 * 5, // Recycle connections every 5 minutes
  backoff: (attempts) => Math.min(0.2 * Math.pow(2, attempts), 2),
  connection: {
    application_name: 'zorando_app'
  },
  onnotice: () => {}
});

// Cache on globalThis across all environments (including production serverless lambdas)
globalForPostgres.sql = sql;

/**
 * Checks if an error is a transient connection / timeout error.
 */
export function isDbConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as Error)?.message || String(err);
  const code = (err as any)?.code;
  return (
    code === 'CONNECT_TIMEOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'CONNECTION_CLOSED' ||
    msg.includes('CONNECT_TIMEOUT') ||
    msg.includes('Connection timeout') ||
    msg.includes('connection timed out') ||
    msg.includes('Connection closed') ||
    msg.includes('write CONNECT_TIMEOUT')
  );
}

/**
 * Executes a database query for SSR with a strict timeout and fallback.
 * Prevents SSR blocking and unhandled connection timeouts.
 */
export async function safeSsrQuery<T>(queryPromise: Promise<T>, fallback: T, timeoutMs = 3500): Promise<T> {
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('SSR DB Query Timeout')), timeoutMs);
    });
    const result = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    console.warn('SSR DB Query fallback used:', (err as Error)?.message || err);
    return fallback;
  }
}

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
