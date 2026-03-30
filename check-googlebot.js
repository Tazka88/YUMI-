import fetch from 'node-fetch';
async function check() {
  const res = await fetch('https://yumidz.vercel.app/sitemap.xml', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('Body start:', text.substring(0, 100));
}
check();
