const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  `              const parts = image.split('/');
              const lastPart = parts[parts.length - 1];
              return lastPart ? lastPart.substring(Math.max(0, lastPart.length - 10)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 6) : '';`,
  `              let code = 0;
              for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
              return Math.abs(code).toString(36);`
);

fs.writeFileSync('server.ts', content);
console.log("Success");
