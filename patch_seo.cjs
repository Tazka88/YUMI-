const fs = require('fs');

let content = fs.readFileSync('src/components/SEO.tsx', 'utf8');

content = content.replace('{keywords && <meta name="keywords" content={keywords} />}', '');

fs.writeFileSync('src/components/SEO.tsx', content);

let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace('<meta data-rh="true" name="keywords" content="${keywords}" />', '');
serverContent = serverContent.replace('<meta data-rh="true" name="keywords" content="${keywords}" />', ''); // in case of multiple

fs.writeFileSync('server.ts', serverContent);
console.log('Removed keywords.');
