const fs = require('fs');

function patchCheckout() {
  const file = 'src/pages/Checkout.tsx';
  let content = fs.readFileSync(file, 'utf8');

  const target = `price: item.promo_price || item.price,`;
  const replacement = `price: item.selectedVariation?.price || item.promo_price || item.price,`;

  if (content.includes(target)) {
    content = content.replaceAll(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Patched Checkout.tsx');
  } else {
    console.log('Target not found in Checkout.tsx');
  }
}

function patchCart() {
  const file = 'src/pages/Cart.tsx';
  let content = fs.readFileSync(file, 'utf8');

  const target1 = `price: item.promo_price || item.price,`;
  const replacement1 = `price: item.selectedVariation?.price || item.promo_price || item.price,`;

  const target2 = `const itemPrice = item.promo_price || item.price;`;
  const replacement2 = `const itemPrice = item.selectedVariation?.price || item.promo_price || item.price;`;

  let patched = false;
  if (content.includes(target1)) {
    content = content.replaceAll(target1, replacement1);
    patched = true;
  }
  if (content.includes(target2)) {
    content = content.replaceAll(target2, replacement2);
    patched = true;
  }
  
  if (patched) {
    fs.writeFileSync(file, content);
    console.log('Patched Cart.tsx');
  } else {
    console.log('Target not found in Cart.tsx');
  }
}

patchCheckout();
patchCart();
