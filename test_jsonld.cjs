const http = require('http');

http.get('http://localhost:3000/product/air-fryer-multismart-ms-af2310-10l-double-stack-2400w-friteuse-sans-huile-2-en-1-ecran-tactile-couleur', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<script type="application\/ld\+json" data-rh="true">([\s\S]*?)<\/script>/);
    if (match) {
      console.log(JSON.stringify(JSON.parse(match[1]), null, 2));
    } else {
      console.log("Not found in HTML!");
    }
  });
});
