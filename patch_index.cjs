const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Strip out title
html = html.replace(/<title data-rh="true">.*?<\/title>\s*/, '');

// Strip out standard meta tags
html = html.replace(/<meta data-rh="true" name="description" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" name="keywords" content=".*?" \/>\s*/, '');

// Strip out OG tags
html = html.replace(/<meta data-rh="true" property="og:title" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:description" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:image" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:url" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:image:width" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:image:height" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:site_name" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:type" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="og:locale" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" property="fb:app_id" content=".*?" \/>\s*/, '');

// Strip out Twitter tags
html = html.replace(/<meta data-rh="true" name="twitter:card" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" name="twitter:title" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" name="twitter:description" content=".*?" \/>\s*/, '');
html = html.replace(/<meta data-rh="true" name="twitter:image" content=".*?" \/>\s*/, '');

// Also clean up any lingering comments
html = html.replace(/<!-- Balises SEO de base -->\s*/, '');
html = html.replace(/<!-- Balises Open Graph \(Facebook, LinkedIn, WhatsApp, etc\.\) -->\s*/, '');
html = html.replace(/<!-- Twitter Tags -->\s*/, '');

fs.writeFileSync('index.html', html);
console.log("index.html patched.");
