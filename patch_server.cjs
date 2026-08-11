const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const host = req.headers.host;\n    if (host && host === 'zorando.com') {\n      return res.redirect(301, `https://www.zorando.com${req.originalUrl}`);\n    }",
  "const hostname = req.hostname;\n    if (hostname === 'zorando.com') {\n      return res.redirect(301, `https://www.zorando.com${req.originalUrl}`);\n    }"
);

fs.writeFileSync('server.ts', code);
