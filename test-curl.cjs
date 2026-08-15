const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const form = new FormData();
  form.append('image', Buffer.from('fake image data'), { filename: 'test.jpg', contentType: 'image/jpeg' });
  
  try {
    // We can't easily bypass auth, let's create a temporary bypass route
  } catch (e) {
    console.log(e);
  }
}
test();
