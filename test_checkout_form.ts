import fs from 'fs';
const code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');
const formStart = code.indexOf('<form onSubmit={handleSubmit}');
const formEnd = code.indexOf('</form>', formStart);
const btnStart = code.indexOf('<button type="submit"', formStart);
console.log('Form Start:', formStart);
console.log('Form End:', formEnd);
console.log('Button Start:', btnStart);
if (btnStart > formStart && btnStart < formEnd) {
  console.log('Button is INSIDE the form');
} else {
  console.log('Button is OUTSIDE the form');
}
