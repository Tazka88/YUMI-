import fetch from 'node-fetch';

async function run() {
  try {
    let res = await fetch('http://localhost:3000/api/delivery/get-fees');
    console.log('Fees:', (await res.text()).substring(0, 500));

    res = await fetch('http://localhost:3000/api/delivery/wilayas');
    console.log('Wilayas:', (await res.text()).substring(0, 500));

    res = await fetch('http://localhost:3000/api/delivery/communes');
    console.log('Communes:', (await res.text()).substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
run();
