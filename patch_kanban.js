import fs from 'fs';

const path = 'src/pages/Admin/OrderKanban.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /title="Envoyer à DHD"/g,
  'title="Envoyer à la livraison"'
);

fs.writeFileSync(path, content);
