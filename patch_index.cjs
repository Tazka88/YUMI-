const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("gtag('config', 'AW-18384476935');")) {
  content = content.replace(
    "gtag('config', 'G-7JLYM1QX3C', { send_page_view: false });",
    "gtag('config', 'G-7JLYM1QX3C', { send_page_view: false });\n      gtag('config', 'AW-18384476935');"
  );
  fs.writeFileSync(file, content);
  console.log('Patched index.html with AW config');
} else {
  console.log('AW config already present');
}
