const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/OrderKanban.tsx', 'utf8');

const buttonRegex = /                                \{onSendToDhd && \([\s\S]*?\}\)[\s\S]*?<button/m;
content = content.replace(buttonRegex, '                                <button');

fs.writeFileSync('src/pages/Admin/OrderKanban.tsx', content);
console.log('patched OrderKanban.tsx button');
