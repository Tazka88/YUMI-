import fs from 'fs';
const path = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "office_id: deliveryMode === 'bureau' ? officeId : null,",
  "office_id: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.original_id : null,\n      office_name: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.name : null,\n      delivery_company: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.company : homeDeliveryCompany,"
);

fs.writeFileSync(path, content);
