const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!layout.includes('CookieBanner')) {
  layout = layout.replace(
    'import TopBar from \'./TopBar\';',
    'import TopBar from \'./TopBar\';\nimport CookieBanner from \'./CookieBanner\';'
  );
  
  layout = layout.replace(
    '    </div>\n  );\n}',
    '      <CookieBanner />\n    </div>\n  );\n}'
  );
  
  fs.writeFileSync('src/components/Layout.tsx', layout);
  console.log('Added CookieBanner to Layout.tsx');
}
