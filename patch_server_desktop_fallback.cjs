const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  `const desktopUrl = \`/api/images/slider_images/\${firstSlide.id}/\${field}\${hash ? '?v=' + hash + '&' : '?'}w=1600\`;`,
  `const width = firstSlide.image_url ? 1600 : 640;
              const desktopUrl = \`/api/images/slider_images/\${firstSlide.id}/\${field}\${hash ? '?v=' + hash + '&' : '?'}w=\${width}\`;`
);

fs.writeFileSync('server.ts', content);
console.log("Success");
