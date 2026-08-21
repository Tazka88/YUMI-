const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  
  // Replace multiline seoHtml assignments with seoHtml = '';
  // Since they are template literals, we can use a regex to match them
  code = code.replace(/seoHtml\s*=\s*`[\s\S]*?`;/g, "seoHtml = '';");
  
  // also replace any inline ones
  code = code.replace(/seoHtml\s*=\s*'<div id="seo-content"[\s\S]*?<\/div>';/g, "seoHtml = '';");
  
  fs.writeFileSync(filepath, code);
  console.log(filepath + " patched for seoHtml.");
}

patchFile('server.ts');
patchFile('api/index.ts');
