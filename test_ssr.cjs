const express = require('express');
const app = require('./dist/server.cjs').default;
const testApp = express();
testApp.use(app);
testApp.listen(3002, () => console.log('Listening on 3002'));
