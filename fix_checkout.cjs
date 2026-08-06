const fs = require('fs');
const path = 'src/pages/Checkout.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /<button type="submit" disabled=\{isSubmitting/g,
  '<button onClick={handleSubmit} disabled={isSubmitting'
);

fs.writeFileSync(path, code);
console.log('Fixed');
