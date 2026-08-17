const fs = require('fs');
let code = fs.readFileSync('src/components/SEO.tsx', 'utf8');

code = code.replace(
  /  useEffect\(\(\) => \{\n    \/\/ Remove the SSR canonical to prevent duplicates with Helmet\n    const ssrCanonical = document\.getElementById\('ssr-canonical'\);\n    if \(ssrCanonical\) \{\n      ssrCanonical\.remove\(\);\n    \}\n  \}, \[\]\);\n/g,
  ''
);

code = code.replace(/import \{ useEffect \} from 'react';\n/, '');

fs.writeFileSync('src/components/SEO.tsx', code);
