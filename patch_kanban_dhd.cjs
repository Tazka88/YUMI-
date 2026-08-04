const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/OrderKanban.tsx', 'utf8');

// Remove onSendToDhd prop
content = content.replace(/  onSendToDhd\?: \(id: number\) => void;\n/g, '');
content = content.replace(/, onSendToDhd \}: OrderKanbanProps\)/g, ' }: OrderKanbanProps)');

// Remove DHD checks
content = content.replace(/order.delivery_company === 'ecomdz' \? 'ECOM-DZ' : 'DHD'/g, "'ECOM-DZ'");

// Remove the button
const buttonRegex = / *\{onSendToDhd && \([\s\S]*?\}\)[\s\S]*?<button/m;
content = content.replace(buttonRegex, '                                <button');

fs.writeFileSync('src/pages/Admin/OrderKanban.tsx', content);
console.log('patched OrderKanban.tsx');
