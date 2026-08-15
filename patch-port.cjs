const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("const PORT = 3000;", "const PORT = process.env.PORT || 3000;");
fs.writeFileSync('server.ts', code);
