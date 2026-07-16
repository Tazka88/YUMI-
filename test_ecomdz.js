import fetch from 'node-fetch';

async function run() {
  try {
    let res = await fetch('http://localhost:3000/api/ecomdz/test');
    console.log('Test:', await res.json());

    res = await fetch('http://localhost:3000/api/ecomdz/communes/16');
    console.log('Communes 16:', await res.json());

    res = await fetch('http://localhost:3000/api/ecomdz/stopdesk/16');
    console.log('Stopdesk 16:', await res.json());
  } catch (e) {
    console.error(e);
  }
}
run();
