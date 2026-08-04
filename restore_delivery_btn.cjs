const fs = require('fs');

// 1. Update OrderKanban.tsx
let kanbanContent = fs.readFileSync('src/pages/Admin/OrderKanban.tsx', 'utf8');
kanbanContent = kanbanContent.replace(/  onPrintOrder: \(id: number\) => void;\n\}/g, '  onPrintOrder: (id: number) => void;\n  onSendToDelivery?: (id: number) => void;\n}');
kanbanContent = kanbanContent.replace(/, onPrintOrder \}: OrderKanbanProps\) \{/g, ', onPrintOrder, onSendToDelivery }: OrderKanbanProps) {');

const printBtnRegex = /(                                <button\s*onClick=\{\(\) => onPrintOrder\(order\.id\)\})/m;
kanbanContent = kanbanContent.replace(printBtnRegex, `                                {onSendToDelivery && (
                                  <button 
                                    onClick={() => onSendToDelivery(order.id)}
                                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                    title="Envoyer à la livraison"
                                  >
                                    <Truck size={16} />
                                  </button>
                                )}
$1`);

fs.writeFileSync('src/pages/Admin/OrderKanban.tsx', kanbanContent);
console.log('Patched OrderKanban.tsx');

// 2. Update Dashboard.tsx
let dashboardContent = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

// The onSendToDelivery prop needs to be passed to OrderKanban
const orderKanbanCompRegex = /(                  <OrderKanban\s*orders=\{sortedOrders\}\s*updateOrderStatus=\{updateOrderStatus\}\s*orderSearchTerm=\{orderSearchTerm\}\s*onDeleteOrder=\{handleDeleteOrder\}\s*onPrintOrder=\{handlePrintOrder\}\s*)\/>/m;

dashboardContent = dashboardContent.replace(orderKanbanCompRegex, `$1                  onSendToDelivery={(id) => sendToEcomDz(id)}
                />`);

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', dashboardContent);
console.log('Patched Dashboard.tsx');
