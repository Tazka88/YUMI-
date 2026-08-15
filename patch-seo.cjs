const fs = require('fs');
let code = fs.readFileSync('src/components/SEO.tsx', 'utf-8');

if (!code.includes('useEffect')) {
  code = code.replace("import { Helmet } from 'react-helmet-async';", "import { Helmet } from 'react-helmet-async';\nimport { useEffect } from 'react';");
}

code = code.replace(
  "  if (currentUrl.length > 'https://www.zorando.com/'.length && currentUrl.endsWith('/')) {",
  `  useEffect(() => {
    // Remove the SSR canonical to prevent duplicates with Helmet
    const ssrCanonical = document.getElementById('ssr-canonical');
    if (ssrCanonical) {
      ssrCanonical.remove();
    }
  }, []);

  if (currentUrl.length > 'https://www.zorando.com/'.length && currentUrl.endsWith('/')) {`
);

fs.writeFileSync('src/components/SEO.tsx', code);
