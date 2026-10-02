const fs = require('fs');
let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

const lines = content.split('\n');
const fixedLines = lines.map(line => {
  if (line.includes('<') || line.includes('</')) {
    // It's likely JSX, replace ${brand.name} with {brand.name}
    return line.replace(/\$\{brand\.name\}/g, '{brand.name}');
  }
  return line;
});

fs.writeFileSync('src/pages/BrandProducts.tsx', fixedLines.join('\n'));
