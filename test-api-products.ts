import http from 'http';
http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data.substring(0, 500)));
}).on('error', (err) => console.error(err));
