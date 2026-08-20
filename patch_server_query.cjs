const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  "const [category] = await sql`SELECT id, name, description FROM categories WHERE slug = ${slug}`;",
  "const [category] = await sql`SELECT id, name FROM categories WHERE slug = ${slug}`;"
);

fs.writeFileSync('server.ts', content);
console.log("Success");
