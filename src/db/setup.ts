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

export const sql = globalForPostgres.sql ?? postgres(connectionString, {
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : 'require',
  // Paramètres optimisés pour Vercel (Environnement Serverless)
  max: 10, // Nombre max de connexions par instance Serverless
  idle_timeout: 2, // Les connexions inactives se ferment après 2s pour éviter qu'elles ne gèlent sur Vercel
  connect_timeout: 10,
  prepare: false, // Requis pour PgBouncer transaction mode
  max_lifetime: 60 * 5,
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
