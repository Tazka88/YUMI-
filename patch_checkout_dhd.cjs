const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// 1. Remove homeDeliveryCompany state
content = content.replace(/  const \[homeDeliveryCompany, setHomeDeliveryCompany\] = useState<'dhd' \| 'ecomdz'>\('dhd'\);\n/g, "");

// 2. Fix payload creation
content = content.replace(/delivery_company: deliveryMode === 'domicile' \? homeDeliveryCompany : selectedOffice\?.company,/g, "delivery_company: 'ecomdz',");

// 3. Remove the entire "Société de livraison (Domicile) *" block
const companyBlockRegex = /              <div>\s*<label className="block text-sm font-medium text-gray-700 mb-2">Société de livraison \(Domicile\) \*<\/label>\s*<div className="grid grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(companyBlockRegex, "");

// 4. Update the office badge
content = content.replace(/\{office.company === "ecomdz" \? "Ecom-DZ" : "DHD"\}/g, '"Ecom-DZ"');
content = content.replace(/office.company === "ecomdz" \? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"/g, '"bg-blue-100 text-blue-700"');


fs.writeFileSync('src/pages/Checkout.tsx', content);
console.log('patched Checkout.tsx');
