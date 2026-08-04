const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

const replacement = `
  const getWilayaId = (wilayaName: string): number => {
    if (!wilayaName) return 16;
    const name = wilayaName.toLowerCase().trim();
    const exactMatch = ALGERIA_WILAYAS[name];
    if (exactMatch) return exactMatch;
    for (const [key, value] of Object.entries(ALGERIA_WILAYAS)) {
      if (name.includes(key) || key.includes(name)) return value;
    }
    return 16; // Default to Alger
  };
`;

content = content.replace(/const ALGERIA_WILAYAS: Record<string, number> = \{[\s\S]*?\};/m, (match) => {
  return match + replacement;
});

content = content.replace(/getDhdWilayaId/g, 'getWilayaId');

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', content);
console.log('patched Dashboard.tsx wilaya mapping');
