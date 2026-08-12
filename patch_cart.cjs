const fs = require('fs');
const file = 'src/pages/Cart.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import { useCartStore } from '../store/cartStore';`;
const importReplacement = `import { useCartStore } from '../store/cartStore';\nimport React, { useEffect, useRef } from 'react';`;
content = content.replace(importTarget, importReplacement);

const componentTarget = `export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCartStore();`;

const componentReplacement = `export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCartStore();
  
  const viewCartTrackedRef = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !viewCartTrackedRef.current) {
      viewCartTrackedRef.current = true;
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const safeValue = isNaN(total()) || total() <= 0 ? 1 : Number(Number(total()).toFixed(2));
        try {
          window.gtag("event", "view_cart", {
            currency: "DZD",
            value: safeValue,
            items: items.map(item => ({
              item_id: item.id.toString(),
              item_name: item.name,
              price: item.promo_price || item.price,
              quantity: item.quantity,
              item_category: item.category_name || undefined
            }))
          });
        } catch (e) {
          console.error('Failed to send GA view_cart event', e);
        }
      }
    }
  }, [items, total]);

  const handleRemoveItem = (item) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        const itemPrice = item.promo_price || item.price;
        const safeValue = isNaN(itemPrice * item.quantity) || itemPrice * item.quantity <= 0 ? 1 : Number(Number(itemPrice * item.quantity).toFixed(2));
        window.gtag("event", "remove_from_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: item.id.toString(),
            item_name: item.name,
            price: itemPrice,
            quantity: item.quantity,
            item_category: item.category_name || undefined
          }]
        });
      } catch (e) {
        console.error('Failed to send GA remove_from_cart event', e);
      }
    }
    removeItem(item.cartItemId || item.id);
  };`;
content = content.replace(componentTarget, componentReplacement);

const onClickTarget = `onClick={() => removeItem(item.cartItemId || item.id)}`;
const onClickReplacement = `onClick={() => handleRemoveItem(item)}`;
content = content.replace(onClickTarget, onClickReplacement);

fs.writeFileSync(file, content);
