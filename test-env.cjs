require('dotenv/config');
const { getSupabase } = require('./dist/server.cjs'); // Wait, getSupabase isn't exported from server.cjs
