import fetch from 'node-fetch';
async function test() {
  const res = await fetch('http://localhost:3006/api/sitemap.xml');
  console.log(res.status, await res.text());
}
test();
