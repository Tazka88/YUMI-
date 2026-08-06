import fetch from 'node-fetch';

async function run() {
  const orderData = {
    customer_name: "Test Double",
    customer_phone: "0555555555",
    wilaya: "Alger",
    commune: "Alger Centre",
    address: "Test 123",
    items: [
      { product_id: 655, quantity: 1, price: 5400 } // using the product we saw earlier
    ],
    delivery_cost: 600,
    stop_desk: false,
    delivery_company: 'ecomdz'
  };

  console.log('Sending two requests...');
  
  const p1 = fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  const p2 = fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  const [res1, res2] = await Promise.all([p1, p2]);
  console.log('Res 1:', res1.status, await res1.text());
  console.log('Res 2:', res2.status, await res2.text());
}

run();
