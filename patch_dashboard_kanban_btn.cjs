const fs = require('fs');
let dashboardContent = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

const orderKanbanCompRegex = /(<OrderKanban[\s\S]*?onPrintOrder=\{printOrder\})/m;

dashboardContent = dashboardContent.replace(orderKanbanCompRegex, `$1
                  onSendToDelivery={(id) => sendToEcomDz(id)}`);

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', dashboardContent);
console.log('Patched Dashboard.tsx');
