const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Redirect non-www to www to consolidate SEO
  app.use((req, res, next) => {
    const hostname = req.hostname;
    if (hostname === 'zorando.com') {
      return res.redirect(301, \`https://www.zorando.com\${req.originalUrl}\`);
    }
    next();
  });`;

const replacement = `  // Redirect non-www to www and force HTTPS to consolidate SEO
  app.use((req, res, next) => {
    const hostname = req.hostname;
    const isHttp = req.headers['x-forwarded-proto'] === 'http';
    
    // Ignore localhost during development
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('run.app')) {
      if (hostname === 'zorando.com' || isHttp) {
        return res.redirect(301, \`https://www.zorando.com\${req.originalUrl}\`);
      }
    }
    next();
  });`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("HTTPS patch applied.");
} else {
  console.log("Target not found.");
}
