const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const regexSeoTags = /let seoTags = `/;
code = code.replace(regexSeoTags, `title = title.replace(/[-–—\\s]+(\\| Zorando)?$/, '') + (title.includes('| Zorando') ? ' | Zorando' : '');\n    let seoTags = \``);

fs.writeFileSync('api/index.ts', code);
console.log("api/index.ts seoTags title fixed.");
