import http from 'http';
import https from 'https';
https.get('https://ais-dev-gdjvqzszojzzmgjbdz2kvf-501951638809.europe-west2.run.app/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => console.error(err));
