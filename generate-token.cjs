const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin@zorando.com', role: 'admin' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
console.log(token);
