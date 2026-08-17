const fs = require('fs');
let code = fs.readFileSync('src/components/SEO.tsx', 'utf8');

const helper = `export function getCanonicalUrl(url?: string) {
  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let currentUrl = rawUrl.split('?')[0];
  // Toujours forcer www.zorando.com comme domaine canonique principal pour éviter le duplicate content
  currentUrl = currentUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');
  if (currentUrl.length > 'https://www.zorando.com/'.length && currentUrl.endsWith('/')) {
    currentUrl = currentUrl.slice(0, -1);
  }
  return currentUrl;
}`;

// I will just prepend it to the file and use it in SEO
code = code.replace("export default function SEO", helper + "\n\nexport default function SEO");

const oldCode = `  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let currentUrl = rawUrl.split('?')[0];
  // Toujours forcer www.zorando.com comme domaine canonique principal pour éviter le duplicate content
  currentUrl = currentUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');

  if (currentUrl.length > 'https://www.zorando.com/'.length && currentUrl.endsWith('/')) {
    currentUrl = currentUrl.slice(0, -1);
  }`;

code = code.replace(oldCode, "  const currentUrl = getCanonicalUrl(url);");

fs.writeFileSync('src/components/SEO.tsx', code);
