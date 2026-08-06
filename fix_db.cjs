const fs = require('fs');
let content = fs.readFileSync('src/db/setup.ts', 'utf8');
content = content.replace(/max: 15,/, 'max: 5,');
content = content.replace(/idle_timeout: 3,/, 'idle_timeout: 1,');
content = content.replace(/prepare: false,/, 'prepare: false,\n  max_lifetime: 60 * 5,');
fs.writeFileSync('src/db/setup.ts', content);
