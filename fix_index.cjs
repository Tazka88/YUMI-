const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace('<div id="root"></div>', '<div id="root"><!--root-injection--></div>');
fs.writeFileSync('index.html', code);
console.log("index.html updated");
