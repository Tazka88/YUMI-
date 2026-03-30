import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/sitemap.xml');
  const text = await res.text();
  console.log(text);
}
check();
