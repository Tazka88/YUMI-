const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

// replace SEO import
code = code.replace("import SEO from '../components/SEO';", "import SEO, { getCanonicalUrl } from '../components/SEO';");

// find and remove the old cleanUrl calculation
const oldCleanUrl = `  const rawUrl = window.location.href;
  let cleanUrl = rawUrl.split('?')[0];
  cleanUrl = cleanUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');
  if (cleanUrl.length > 'https://www.zorando.com/'.length && cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }`;

code = code.replace(oldCleanUrl, "  const cleanUrl = getCanonicalUrl();");

fs.writeFileSync('src/pages/Product.tsx', code);
