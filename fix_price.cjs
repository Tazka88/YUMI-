const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/\$\{displayPrice\}/g, '${currentPrice.toFixed(2)}');
  fs.writeFileSync(file, code);
}
console.log("Price fixed.");
