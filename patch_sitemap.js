const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');
code = code.replace(
  "sql`SELECT slug, created_at FROM products`,",
  "sql`SELECT slug, created_at FROM products WHERE is_active = true`,"
);
fs.writeFileSync('src/api/routes.ts', code);
console.log('Patched routes.ts');
