const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Replace the hidden div with a visible prose div
  const hiddenDivStyle1 = '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">';
  const visibleDivStyle1 = '<div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">';
  
  // also check with \n or \r\n if needed, but the strings above are exact matches for the opening tag.
  
  if (code.includes(hiddenDivStyle1)) {
    code = code.split(hiddenDivStyle1).join(visibleDivStyle1);
    console.log("Patched div styles in " + file);
  }

  // Also replace `seoHtml = ''` with something? No, the user said "NE SUPPRIME PAS ce contenu SEO. À la place, rends ce contenu réellement accessible et visible aux utilisateurs dans la page."
  
  // Next, the user says: "NE mets pas systématiquement le mot 'Algérie' dans le nom du produit lui-même."
  // Wait, the user is saying the logic of the code needs to be generically good, not just unhiding the divs.
  
  fs.writeFileSync(file, code);
}

patchFile('server.ts');
patchFile('api/index.ts');
