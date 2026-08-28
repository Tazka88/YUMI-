const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf-8');
  const searchStr = 'headHtml += `<meta property="product:price:currency" content="DZD" />\\n`;';
  const replaceStr = 'headHtml += `<meta property="product:price:currency" content="DZD" />\\n`;\n          headHtml += `<meta property="product:availability" content="${product.stock > 0 ? \'in stock\' : \'out of stock\'}" />\\n`;';
  
  if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync(file, code);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find target string in ${file}`);
  }
}
