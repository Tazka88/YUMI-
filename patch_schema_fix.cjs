const fs = require('fs');
const file = 'src/lib/schemaUtils.ts';
let code = fs.readFileSync(file, 'utf-8');

const searchStr = `  if (product.images && Array.isArray(product.images)) {
    for (let img of product.images) {
      if (img && img.startsWith('/')) {
        images.push(\`\${baseUrl}\${img}\`);
      } else if (img) {
        images.push(img);
      }
    }
  }`;

const replaceStr = `  if (product.images && Array.isArray(product.images)) {
    for (let img of product.images) {
      const imgStr = typeof img === 'string' ? img : img?.image;
      if (imgStr && typeof imgStr === 'string') {
        if (imgStr.startsWith('/')) {
          images.push(\`\${baseUrl}\${imgStr}\`);
        } else {
          images.push(imgStr);
        }
      }
    }
  }`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync(file, code);
  console.log("Fixed schemaUtils.ts");
} else {
  console.log("Could not find string in schemaUtils.ts");
}
