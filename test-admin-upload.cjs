const jwt = require('jsonwebtoken');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function run() {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'secret');
  const form = new FormData();
  form.append('image', fs.createReadStream('test.png'));
  
  try {
    const res = await axios.post('http://localhost:3000/api/admin/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("STATUS:", err.response.status);
      console.log("ERROR DATA:", err.response.data);
    } else {
      console.log("ERROR:", err.message);
    }
  }
}
run();
