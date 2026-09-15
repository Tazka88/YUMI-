const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // First, fix the emojis in title
  code = code.replace(
    "title = '🍳 Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO';",
    "title = 'Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO';"
  );
  
  const searchPattern = \`<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
            <h1>☕ Bouilloires Moulinex en Algérie</h1>\`;
            
  const replacePattern = \`<div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
            <h1>Bouilloires Moulinex en Algérie</h1>\`;
            
  if (code.includes(searchPattern)) {
    code = code.replace(searchPattern, replacePattern);
    console.log("Successfully patched " + file);
  } else {
    console.log("Could not find pattern in " + file);
  }
  
  fs.writeFileSync(file, code);
}

patchFile('api/index.ts');
patchFile('server.ts');
