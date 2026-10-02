const http = require('http');

const urls = [
  "http://localhost:3000/product/tondeuse-kemei-km-032-tondeuse-rechargeable-usb-pour-cheveux-barbe-et-moustache",
  "http://localhost:3000/product/tondeuse-professionnelle-kemei-km-700b-sans-fil-rechargeable-coupe-precise-ecran-lcd-algerie",
  "http://localhost:3000/product/tondeuse-kemei-km-1524-tondeuse-rechargeable-usb-pour-cheveux-barbe-et-finitions",
  "http://localhost:3000/product/pompe-air-portable-et-durable-hoco-zp5-avec-affichage-num-rique-led",
  "http://localhost:3000/product/bouilloire-electrique-17l-2400w-noir",
  "http://localhost:3000/product/ecouteurs-sans-fil-hoco-eq8-pure-joy",
  "http://localhost:3000/product/kit-tondeuse-professionnelle-kemei-km-8565-ensemble-2-en-1-rechargeable-sans-fil-usb-c",
  "http://localhost:3000/product/tondeuse-professionnelle-kemei-km-pg232-blanche-sans-fil-7500-rpm-ecran-led-usb-c",
  "http://localhost:3000/product/tondeuse-professionnelle-kemei-km-1859-sans-fil-8000-rpm-batterie-2000-mah-usb-c",
  "http://localhost:3000/product/tondeuse-de-precision-rechargeable-wmark-ng-1205-professionnelle-usb-c-7000-rpm"
];

async function run() {
  for (let url of urls) {
    await new Promise(resolve => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let noindexMeta = data.includes('noindex');
          console.log(`URL: ${url}`);
          console.log(`Status: ${res.statusCode}`);
          console.log(`X-Robots-Tag Header: ${res.headers['x-robots-tag'] || 'none'}`);
          console.log(`Location Header: ${res.headers['location'] || 'none'}`);
          console.log(`HTML Contains 'noindex': ${noindexMeta}`);
          console.log('---');
          resolve();
        });
      }).on('error', (e) => {
        console.error(e);
        resolve();
      });
    });
  }
}
run();
