const fs = require('fs');
function revert(file) {
  let code = fs.readFileSync(file, 'utf-8');
  // Revert the wrong replacement in Home page (and any others that were wrong)
  code = code.replace(
    '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose" id="seo-static-content">',
    '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">'
  );
  
  // Now explicitly replace ONLY the one for bouilloires
  // First we locate the bouilloires H1
  const targetH1 = '<h1>Bouilloires Moulinex en Algérie</h1>';
  
  const searchPattern = '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">\n            <h1>Bouilloires';
  const replacePattern = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose" id="seo-static-content">\n            <h1>Bouilloires';
  
  if (code.includes(searchPattern)) {
    code = code.replace(searchPattern, replacePattern);
    console.log("Fixed " + file);
  } else {
    // try different spacing
    const searchPattern2 = '<div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">\r\n            <h1>Bouilloires';
    const replacePattern2 = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose" id="seo-static-content">\r\n            <h1>Bouilloires';
    if (code.includes(searchPattern2)) {
      code = code.replace(searchPattern2, replacePattern2);
      console.log("Fixed " + file + " (CRLF)");
    } else {
      console.log("Could not find the target div in " + file);
    }
  }
  
  fs.writeFileSync(file, code);
}

revert('api/index.ts');
revert('server.ts');
