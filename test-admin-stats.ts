import http from 'http';
const data = JSON.stringify({ username: 'admin@admin.com', password: 'admin123' });
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    http.get('http://localhost:3000/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => console.log('Stats:', data2));
    });
  });
});
req.write(data);
req.end();
