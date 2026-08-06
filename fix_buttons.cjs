const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// Change the discount button to type="button"
content = content.replace(
  /<button \s*onClick=\{handleApplyDiscount\}/g,
  '<button type="button" onClick={handleApplyDiscount}'
);

// Change the Address Picker button to type="button" (Wait, it already is)
// <button type="button" onClick={() => setShowAddressPicker(!showAddressPicker)}

// Change the final submit button to type="submit" and REMOVE onClick
// Because the form already has onSubmit={handleSubmit}
content = content.replace(
  /<button\s*onClick=\{handleSubmit\}\s*disabled=\{isSubmitting/g,
  '<button type="submit" disabled={isSubmitting'
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
console.log('Fixed buttons');
