import http from 'http';
['categories', 'brands', 'slides', 'settings'].forEach(endpoint => {
  http.get(`http://localhost:3000/api/${endpoint}`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`/${endpoint}:`, res.statusCode, data.substring(0, 100)));
  }).on('error', (err) => console.error(err));
});
