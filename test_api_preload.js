import express from 'express';
import app from './api/index.js';
const testApp = express();
testApp.use(app);
testApp.listen(3002, () => console.log('Listening on 3002'));
