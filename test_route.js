const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
console.log(code.includes("if (slug === 'all') {") ? "Fix is present in server.ts" : "Fix is NOT present in server.ts");
