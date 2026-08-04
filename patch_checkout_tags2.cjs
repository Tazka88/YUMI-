const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(/              <\/div>\n              <div>\n            \)}\n/g, "              </div>\n            )}\n              <div>\n");

fs.writeFileSync('src/pages/Checkout.tsx', content);
