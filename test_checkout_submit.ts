import fs from 'fs';
const code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');
const match = code.match(/const handleSubmit = async.*?if \(orderSuccess\)/s);
console.log(match ? match[0] : 'not found');
