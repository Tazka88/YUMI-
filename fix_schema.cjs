const fs = require('fs');

let code = fs.readFileSync('src/lib/schemaUtils.ts', 'utf8');

const regex = /let mpn = '';[\s\S]*?schema\.identifier_exists = false;\n  \}/g;
code = code.replace(regex, '');

fs.writeFileSync('src/lib/schemaUtils.ts', code);
console.log('Fixed schemaUtils.ts');
