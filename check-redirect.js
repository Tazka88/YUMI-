import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/sitemap.xml', { redirect: 'manual' });
  console.log('Status:', res.status);
  console.log('Location:', res.headers.get('location'));
  console.log('Content-Type:', res.headers.get('content-type'));
}
check();
