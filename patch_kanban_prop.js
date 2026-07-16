import fs from 'fs';
const path = 'src/pages/Admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "onSendToDhd={sendToDhd}",
  "onSendToDhd={(id) => deliveryCompany === 'dhd' ? sendToDhd(id) : sendToEcomDz(id)}"
);

fs.writeFileSync(path, content);
