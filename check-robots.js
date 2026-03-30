import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/robots.txt');
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('Body:', text);
}
check();
