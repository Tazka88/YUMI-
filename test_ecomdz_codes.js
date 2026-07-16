import fetch from 'node-fetch';
async function run() {
  try {
    let res = await fetch('http://localhost:3000/api/ecomdz/stopdesk');
    let data = await res.json();
    let numericOnly = data.Commune.filter(c => !isNaN(Number(c.Code)));
    console.log('Numeric codes:', numericOnly.length > 0 ? numericOnly : 'None');
  } catch (e) {
    console.error(e);
  }
}
run();
