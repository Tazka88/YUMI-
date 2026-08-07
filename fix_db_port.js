const fs = require('fs');
let content = fs.readFileSync('src/db/setup.ts', 'utf8');
content = content.replace(
  "let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';",
  "let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:6543/postgres';\nif (connectionString.includes(':5432')) {\n  connectionString = connectionString.replace(':5432', ':6543');\n}"
);
fs.writeFileSync('src/db/setup.ts', content);
