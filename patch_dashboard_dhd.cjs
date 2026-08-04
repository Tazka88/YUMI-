const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

// 1. setDeliveryCompany
content = content.replace(/useState<'dhd' \| 'ecomdz'>\('dhd'\);/g, "useState<'ecomdz'>('ecomdz');");

// 2. Remove getDhdWilayaId function
const getDhdRegex = /  const getDhdWilayaId = \([\s\S]*?^  \};/m;
content = content.replace(getDhdRegex, '');

// 3. Remove sendToDhd function
const sendToDhdRegex = /  const sendToDhd = async \([\s\S]*?^  \};/m;
content = content.replace(sendToDhdRegex, '');

// 4. Remove handleBulkDhd function
const handleBulkDhdRegex = /  const handleBulkDhd = async \([\s\S]*?^  \};/m;
content = content.replace(handleBulkDhdRegex, '');

// 5. Update Bulk send in sendSelectedOrders
content = content.replace(/const success = company === 'ecomdz' \? await sendToEcomDz\(id, true\) : await sendToDhd\(id, true\);/g, "const success = await sendToEcomDz(id, true);");

// 6. Update onSendToDhd prop -> just remove it
content = content.replace(/                  onSendToDhd=\{[\s\S]*?\n/g, '');

// 7. Remove delivery company select option for DHD
content = content.replace(/                            <option value="dhd">DHD<\/option>\n/g, '');
content = content.replace(/onChange=\{\(e\) => setDeliveryCompany\(e.target.value as 'dhd' \| 'ecomdz'\)\}/g, "onChange={(e) => setDeliveryCompany(e.target.value as 'ecomdz')}");

// 8. Order List row company tag
content = content.replace(/\{order.delivery_company === 'ecomdz' \? 'ECOM-DZ' : 'DHD'\}/g, "'ECOM-DZ'");
content = content.replace(/order.delivery_company === 'ecomdz' \? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'/g, "'bg-blue-100 text-blue-700'");

// 9. Order List row send action
content = content.replace(/const c = order.delivery_company \|\| deliveryCompany; return c === 'ecomdz' \? sendToEcomDz\(order.id\) : sendToDhd\(order.id\);/g, "sendToEcomDz(order.id);");

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', content);
console.log('patched Dashboard.tsx');
