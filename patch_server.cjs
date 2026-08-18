const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Trust proxy to handle X-Forwarded-For correctly
  app.set('trust proxy', 1);`;

const replacement = `  // Trust proxy to handle X-Forwarded-For correctly
  app.set('trust proxy', 1);

  // Redirection explicite du favicon pour éviter le Soft 404 du SSR
  app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/favicon-zorando.svg');
  });`;

if (code.includes(target) && !code.includes('/favicon.ico')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("server.ts patched.");
} else {
    console.log("Not patched. Target not found or already patched.");
}
