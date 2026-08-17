const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace(
  'title="Boutique en Ligne Algérie : Achetez au Meilleur Prix"',
  'title="Achat en Ligne en Algérie au Meilleur Prix"'
);

fs.writeFileSync('src/pages/Home.tsx', code);
