const fs = require('fs');
let code = fs.readFileSync('src/components/SEO.tsx', 'utf8');

const regexFullTitle = /const fullTitle = exactTitle \? title : `\$\{title\} \| \$\{siteName\}`;/;
code = code.replace(regexFullTitle, `const cleanTitle = title.replace(/[-–—\\s]+$/, '');\n  const fullTitle = exactTitle ? cleanTitle : \`\${cleanTitle} | \${siteName}\`;`);

fs.writeFileSync('src/components/SEO.tsx', code);
console.log("SEO.tsx title trailing hyphens fixed.");
