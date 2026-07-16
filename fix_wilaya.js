import fs from 'fs';
const path = 'src/pages/Admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const wilayaId = wilayaMatch ? wilayaMatch[1] : "16";',
  'const wilayaId = wilayaMatch ? parseInt(wilayaMatch[1]) : 16;'
);

fs.writeFileSync(path, content);
