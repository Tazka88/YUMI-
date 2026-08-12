const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          try {
            window.gtag("event", "purchase", {
              transaction_id: Date.now().toString(),
              value: safeValue,
              currency: "DZD",
              shipping: deliveryCost,
              items: checkoutItems.map(item => ({
                item_id: item.id.toString(),
                item_name: item.name,
                price: item.promo_price || item.price,
                quantity: item.quantity
              }))
            });
          } catch (e) {
            console.error('Failed to send GA purchase event', e);
          }
        }`;

const replacement = `        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          try {
            window.gtag("event", "purchase", {
              transaction_id: String(responseData.order_id || responseData.id),
              value: safeValue,
              currency: "DZD",
              shipping: deliveryCost,
              items: checkoutItems.map(item => ({
                item_id: item.id.toString(),
                item_name: item.name,
                price: item.promo_price || item.price,
                quantity: item.quantity,
                item_category: item.category_name || undefined
              }))
            });
          } catch (e) {
            console.error('Failed to send GA purchase event', e);
          }
        }`;

if (content.includes('Date.now().toString()')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched purchase event');
} else {
  console.log('Target not found');
}
