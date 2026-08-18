const fs = require('fs');
const file = 'src/components/SEO.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
`export function getCanonicalUrl(url?: string) {
  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let currentUrl = rawUrl.split('?')[0];
  // Toujours forcer www.zorando.com comme domaine canonique principal pour éviter le duplicate content
  currentUrl = currentUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');
  if (currentUrl.length > 'https://www.zorando.com/'.length && currentUrl.endsWith('/')) {
    currentUrl = currentUrl.slice(0, -1);
  }
  return currentUrl;
}`,
`export function getCanonicalUrl(url?: string) {
  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let baseUrl = rawUrl.split('?')[0];
  let queryString = rawUrl.includes('?') ? rawUrl.split('?')[1] : '';
  
  // Toujours forcer www.zorando.com comme domaine canonique principal pour éviter le duplicate content
  baseUrl = baseUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');
  if (baseUrl.length > 'https://www.zorando.com/'.length && baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Preserver uniquement les parametres structurels
  if (queryString) {
    const params = new URLSearchParams(queryString);
    const structuralParams = new URLSearchParams();
    if (params.get('sub') === 'true') structuralParams.set('sub', 'true');
    if (params.get('subsub') === 'true') structuralParams.set('subsub', 'true');
    
    if (structuralParams.toString()) {
      return \`\${baseUrl}?\${structuralParams.toString()}\`;
    }
  }
  
  return baseUrl;
}`);
fs.writeFileSync(file, code);
