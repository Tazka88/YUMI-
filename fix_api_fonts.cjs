const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

content = content.replace(
  /let headHtml = `<link rel="canonical" href="\$\{baseUrl\}\$\{req\.path\}" \/>`;/g,
  'let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />\\n<link rel="preload" as="font" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" type="font/woff2" crossorigin="anonymous">`;'
);

content = content.replace(
  /headHtml = `\\n          <link rel="canonical" href="\$\{baseUrl\}\$\{req\.path\}" \/>`;/g,
  'headHtml = `\\n          <link rel="canonical" href="${baseUrl}${req.path}" />\\n          <link rel="preload" as="font" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" type="font/woff2" crossorigin="anonymous">`;'
);

fs.writeFileSync('api/index.ts', content);
console.log("Fonts preloaded in SSR");
