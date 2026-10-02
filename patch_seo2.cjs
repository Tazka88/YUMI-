const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Replace title emoji
  code = code.replace(
    "title = '🍳 Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO';",
    "title = 'Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO';"
  );
  
  // Replace H1 emoji
  code = code.replace(
    "<h1>☕ Bouilloires Moulinex en Algérie</h1>",
    "<h1>Bouilloires Moulinex en Algérie</h1>"
  );
  
  // Replace div styles
  code = code.replace(
    '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">',
    '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose" id="seo-static-content">'
  );
  
  fs.writeFileSync(file, code);
  console.log("Successfully patched " + file);
}

patchFile('api/index.ts');
patchFile('server.ts');
