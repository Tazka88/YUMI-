const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const targetAdminBlock = `if (search) {
      const searchTerm = \`%\${search}%\`;
      conditions.push(sql\`(p.name ILIKE \${searchTerm} OR p.description ILIKE \${searchTerm} OR p.id::text ILIKE \${searchTerm} OR p.sku ILIKE \${searchTerm})\`);
    }`;

const replacementAdminBlock = `if (search) {
      const searchWords = search.trim().split(/\\s+/).filter(word => word.length > 0);
      if (searchWords.length > 0) {
        const wordConditions = searchWords.map(word => {
           const searchTerm = \`%\${word}%\`;
           return sql\`(p.name ILIKE \${searchTerm} OR p.description ILIKE \${searchTerm} OR p.id::text ILIKE \${searchTerm} OR p.sku ILIKE \${searchTerm})\`;
        });
        const combined = sql\`(\${wordConditions.reduce((acc, curr) => sql\`\${acc} AND \${curr}\`)})\`;
        conditions.push(combined);
      }
    }`;

if (code.includes(targetAdminBlock)) {
    code = code.replace(targetAdminBlock, replacementAdminBlock);
    fs.writeFileSync('src/api/routes.ts', code);
    console.log("Patched admin search successfully");
} else {
    console.log("Could not find admin target");
}
