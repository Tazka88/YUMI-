import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/sitemap.xml');
  console.log('Headers:');
  for (const [key, value] of res.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
}
check();
