import fs from 'fs';
const path = 'src/pages/Admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace handleBulkDelivery
const oldBulk = `const handleBulkDelivery = async () => {
    if (selectedOrders.length === 0) return;
    const loadId = toast.loading(\`Envoi de \${selectedOrders.length} commandes vers \${deliveryCompany.toUpperCase()}...\`);
    let successCount = 0;
    
    for (const id of selectedOrders) {
      const success = deliveryCompany === 'dhd' ? await sendToDhd(id, true) : await sendToEcomDz(id, true);
      if (success) successCount++;
    }
    
    toast.success(\`\${successCount}/\${selectedOrders.length} envoyée(s) à \${deliveryCompany.toUpperCase()}\`, { id: loadId });
    setSelectedOrders([]);
  };`;

const newBulk = `const handleBulkDelivery = async () => {
    if (selectedOrders.length === 0) return;
    const loadId = toast.loading(\`Envoi de \${selectedOrders.length} commandes...\`);
    let successCount = 0;
    
    for (const id of selectedOrders) {
      const order = orders.find(o => o.id === id);
      const company = order?.delivery_company || deliveryCompany;
      const success = company === 'ecomdz' ? await sendToEcomDz(id, true) : await sendToDhd(id, true);
      if (success) successCount++;
    }
    
    toast.success(\`\${successCount}/\${selectedOrders.length} envoyée(s)\`, { id: loadId });
    setSelectedOrders([]);
  };`;
  
content = content.replace(oldBulk, newBulk);

// Replace the kanban callback
content = content.replace(
  "onSendToDhd={(id) => deliveryCompany === 'dhd' ? sendToDhd(id) : sendToEcomDz(id)}",
  "onSendToDhd={(id) => { const o = orders.find(x => x.id === id); const c = o?.delivery_company || deliveryCompany; return c === 'ecomdz' ? sendToEcomDz(id) : sendToDhd(id); }}"
);

// Replace the table row button callback
content = content.replace(
  "onClick={() => deliveryCompany === 'dhd' ? sendToDhd(order.id) : sendToEcomDz(order.id)}",
  "onClick={() => { const c = order.delivery_company || deliveryCompany; return c === 'ecomdz' ? sendToEcomDz(order.id) : sendToDhd(order.id); }}"
);

// We need to fetch order details including delivery_company in orders list
// Let's add it to the UI display if we want.

fs.writeFileSync(path, content);
