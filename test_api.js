import http from 'http';

function testEndpoint(path) {
  http.get('http://localhost:3000' + path, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`[${path}] Status: ${res.statusCode}`);
      if (res.statusCode >= 400) {
        console.log(`[${path}] Error Response: ${data.substring(0, 500)}`);
      }
    });
  }).on('error', (err) => {
    console.log(`[${path}] Request Error: ${err.message}`);
  });
}

testEndpoint('/api/products');
testEndpoint('/api/categories');
testEndpoint('/api/settings');
testEndpoint('/api/hero-banners');
testEndpoint('/api/brands');
testEndpoint('/api/admin/products');
testEndpoint('/api/admin/settings');
