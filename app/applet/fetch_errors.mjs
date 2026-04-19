import http from 'http';

function fetchUrl(url) {
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
  });
}

fetchUrl('http://localhost:3000/api/categories');
fetchUrl('http://localhost:3000/api/brands');
