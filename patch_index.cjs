const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove corrupted favicons
code = code.replace(/<link rel="icon" href="\/favicon\.ico" sizes="any">\s*/g, '');
code = code.replace(/<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-zorando-32x32\.png">\s*/g, '');
code = code.replace(/<link rel="apple-touch-icon" sizes="192x192" href="\/icon-192\.png">\s*/g, '');

fs.writeFileSync('index.html', code);
console.log("index.html patched.");
