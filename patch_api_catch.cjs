const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(/catch\s*\(e\)\s*\{\s*\}/g, 'catch(e) { console.error("DB Error in SSR:", e); }');
fs.writeFileSync('api/index.ts', code);

code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/catch\s*\(e\)\s*\{\s*\}/g, 'catch(e) { console.error("DB Error in SSR:", e); }');
fs.writeFileSync('server.ts', code);

console.log("Patched catch blocks");
