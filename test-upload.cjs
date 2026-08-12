const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function run() {
  const form = new FormData();
  form.append('image', fs.createReadStream('test.png'));
  
  // To test /admin/upload without token, let's temporarily modify routes.ts to skip auth for this test? No, that's risky.
  // Wait, I can just use /reviews/upload!
  
  try {
    const res = await axios.post('http://localhost:3000/api/reviews/upload', form, {
      headers: form.getHeaders()
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
