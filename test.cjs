const fs = require('fs');
const code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');
console.log(code.substring(0, 500));
