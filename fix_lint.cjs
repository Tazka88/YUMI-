const fs = require('fs');

// Fix categorySEOData
let seoData = fs.readFileSync('src/utils/seoData.ts', 'utf8');
seoData = seoData.replace(
  /export const categorySEOData: Record<string, \{ title: string, description: string, h1: string, intro: string, links: \{ text: string, url: string \}\[\] \}> = \{/,
  'export const categorySEOData: Record<string, { title: string, description: string, h1: string, intro: string, links: { text: string, url: string }[], keywords?: string }> = {'
);
fs.writeFileSync('src/utils/seoData.ts', seoData);

// Fix cleanForSEO in api/index.ts
let apiIndex = fs.readFileSync('api/index.ts', 'utf8');
apiIndex = apiIndex.replace(
  /const cleanForSEO = \(text, truncateLength\) => \{/g,
  'const cleanForSEO = (text: any, truncateLength?: number) => {'
);
fs.writeFileSync('api/index.ts', apiIndex);

// Fix cleanForSEO in server.ts
let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(
  /const cleanForSEO = \(text, truncateLength\) => \{/g,
  'const cleanForSEO = (text: any, truncateLength?: number) => {'
);
fs.writeFileSync('server.ts', serverTs);

console.log('Fixed linting errors');
