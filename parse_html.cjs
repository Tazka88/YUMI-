const fs = require('fs');
const html = fs.readFileSync('/tmp/prod_home.html', 'utf8');

const preloadMobile = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(max-width: 767px\)"/);
const preloadDesktop = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(min-width: 768px\)"/);

console.log("Preload Mobile:", preloadMobile ? preloadMobile[1] : "Not found");
console.log("Preload Desktop:", preloadDesktop ? preloadDesktop[1] : "Not found");
