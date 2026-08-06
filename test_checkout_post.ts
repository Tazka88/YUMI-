import fetch from 'node-fetch';

async function run() {
  const orderData = {
    customer_name: "Test User",
    customer_email: "test@example.com",
    customer_phone: "0555555555",
    wilaya: "Alger",
    commune: "Alger Centre",
    address: "Test 123",
    note: "",
    total_amount: 5400,
    delivery_cost: 600,
    stop_desk: false,
    office_id: null,
    office_name: null,
    delivery_company: 'ecomdz',
    customer_user_id: null,
    items: [
      {
        product_id: 655,
        quantity: 1,
        price: 5400,
        variation: null
      }
    ]
  };

  console.log('Sending request...');
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

run();
