const https = require('https');

const urls = [
  "https://www.zorando.com/product/tondeuse-kemei-km-032-tondeuse-rechargeable-usb-pour-cheveux-barbe-et-moustache",
  "https://www.zorando.com/product/tondeuse-professionnelle-kemei-km-700b-sans-fil-rechargeable-coupe-precise-ecran-lcd-algerie",
  "https://www.zorando.com/product/tondeuse-kemei-km-1524-tondeuse-rechargeable-usb-pour-cheveux-barbe-et-finitions",
  "https://www.zorando.com/product/pompe-air-portable-et-durable-hoco-zp5-avec-affichage-num-rique-led",
  "https://www.zorando.com/product/bouilloire-electrique-17l-2400w-noir",
  "https://www.zorando.com/product/ecouteurs-sans-fil-hoco-eq8-pure-joy",
  "https://www.zorando.com/product/kit-tondeuse-professionnelle-kemei-km-8565-ensemble-2-en-1-rechargeable-sans-fil-usb-c",
  "https://www.zorando.com/product/tondeuse-professionnelle-kemei-km-pg232-blanche-sans-fil-7500-rpm-ecran-led-usb-c",
  "https://www.zorando.com/product/tondeuse-professionnelle-kemei-km-1859-sans-fil-8000-rpm-batterie-2000-mah-usb-c",
  "https://www.zorando.com/product/tondeuse-de-precision-rechargeable-wmark-ng-1205-professionnelle-usb-c-7000-rpm"
];

async function run() {
  for (let url of urls) {
    await new Promise(resolve => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let hasNoIndex = data.toLowerCase().includes('noindex');
          let hasRobotsMeta = data.match(/<meta[^>]*name=["']robots["'][^>]*>/i);
          
          console.log(`URL: ${url}`);
          console.log(`Status: ${res.statusCode}`);
          console.log(`X-Robots-Tag Header: ${res.headers['x-robots-tag'] || 'none'}`);
          console.log(`Location Header: ${res.headers['location'] || 'none'}`);
          console.log(`Contains 'noindex': ${hasNoIndex}`);
          if (hasRobotsMeta) console.log(`Robots Meta: ${hasRobotsMeta[0]}`);
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
