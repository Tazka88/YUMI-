const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/<script type="application\/ld\+json" data-rh="true">/g, '<script type="application/ld+json">');
  fs.writeFileSync(file, code);
}
