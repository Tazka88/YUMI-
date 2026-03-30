import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/robots.txt');
  console.log('Status:', res.status);
  console.log('Content:', await res.text());
}
check();
