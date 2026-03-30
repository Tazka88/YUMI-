import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/sitemap.xml?v=1');
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
}
check();
