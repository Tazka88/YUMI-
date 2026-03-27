import { setupDb } from './src/db/setup.js';
setupDb().then(() => { console.log('Done'); process.exit(0); });
