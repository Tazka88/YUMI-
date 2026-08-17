const http = require('http');

http.get('http://localhost:3000/product/air-fryer-multismart-ms-af2310-10l-double-stack-2400w-friteuse-sans-huile-2-en-1-ecran-tactile-couleur', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    if (matches) {
      matches.forEach((m, i) => {
        console.log(`Match ${i}:`);
        console.log(m.substring(0, 500) + (m.length > 500 ? '...' : ''));
      });
    } else {
      console.log("No application/ld+json scripts found!");
    }
  });
});
