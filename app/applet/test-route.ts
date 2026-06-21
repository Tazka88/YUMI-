import http from 'http';

http.get('http://localhost:3000/api/hero-banners/first-image/desktop', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    let buffer = Buffer.concat(data);
    console.log('Response size:', buffer.length);
  });
});
