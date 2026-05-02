import { sql } from './src/db/setup.ts';

async function killConnections() {
   try {
      const res = await sql`
         SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE pid <> pg_backend_pid()
         AND datname = current_database()
         AND usename = current_user;
      `;
      console.log('Killed other connections', res.length);
   } catch(e) {
      console.error(e);
   }
   process.exit(0);
}
killConnections();
