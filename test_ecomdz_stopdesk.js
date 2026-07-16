import fetch from 'node-fetch';
async function run() {
  try {
    let res = await fetch('http://localhost:3000/api/ecomdz/stopdesk');
    let data = await res.json();
    console.log('Stopdesk All count:', data.Commune ? data.Commune.length : 0);
  } catch (e) {
    console.error(e);
  }
}
run();
