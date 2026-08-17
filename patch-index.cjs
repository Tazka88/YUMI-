const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Lang
html = html.replace('<html lang="en">', '<html lang="fr">');

// 2. data-rh="true"
html = html.replace('<title>', '<title data-rh="true">');
html = html.replace(/<meta name="description"/g, '<meta data-rh="true" name="description"');
html = html.replace(/<meta name="keywords"/g, '<meta data-rh="true" name="keywords"');

const ogProps = [
  'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 
  'og:url', 'og:site_name', 'og:type', 'og:locale', 'fb:app_id'
];
ogProps.forEach(prop => {
  const regex = new RegExp(`<meta property="${prop}"`, 'g');
  html = html.replace(regex, `<meta data-rh="true" property="${prop}"`);
});

const twProps = [
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'
];
twProps.forEach(prop => {
  const regex = new RegExp(`<meta name="${prop}"`, 'g');
  html = html.replace(regex, `<meta data-rh="true" name="${prop}"`);
});

fs.writeFileSync('index.html', html);
