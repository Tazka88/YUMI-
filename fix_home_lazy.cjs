const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  /loading=\{index < 4 \? "eager" : "lazy"\}/g,
  'loading="lazy"\n          decoding="async"' // make it explicitly lazy
);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log("Home.tsx images lazy loaded");
