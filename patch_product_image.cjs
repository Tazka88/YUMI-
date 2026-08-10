const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

const oldImageLine = `"image": product.image || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(product.name)}&background=random&size=800\`,`;
const newImageLine = `"image": (product.image && product.image.startsWith('/')) ? \`https://www.zorando.com\${product.image}\` : (product.image || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(product.name)}&background=random&size=800\`),`;

code = code.replace(oldImageLine, newImageLine);
fs.writeFileSync('src/pages/Product.tsx', code);
