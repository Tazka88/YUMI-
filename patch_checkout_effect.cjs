const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    if (trackingIds.fb && checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const eventId = generateEventId();
      const safeValue = isNaN(checkoutTotal) || checkoutTotal <= 0 ? 1 : Number(Number(checkoutTotal).toFixed(2));
      
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          value: safeValue,
          currency: 'DZD',
          content_ids: checkoutItems.map(item => String(item.id)),
          content_type: 'product',
          num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
        }, { eventID: eventId });
      }
      
      sendCapiEvent({
        eventName: 'InitiateCheckout',
        eventId: eventId,
        customData: {
          value: safeValue,
          currency: 'DZD',
          content_ids: checkoutItems.map(item => String(item.id)),
          content_type: 'product',
          num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
        }
      });
    }
  }, [trackingIds.fb, checkoutItems, checkoutTotal]);`;

const replacement = `  useEffect(() => {
    if (checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const eventId = generateEventId();
      const safeValue = isNaN(checkoutTotal) || checkoutTotal <= 0 ? 1 : Number(Number(checkoutTotal).toFixed(2));
      
      // GA4 begin_checkout event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag("event", "begin_checkout", {
            currency: "DZD",
            value: safeValue,
            items: checkoutItems.map(item => ({
              item_id: item.id.toString(),
              item_name: item.name,
              price: item.promo_price || item.price,
              quantity: item.quantity,
              item_category: item.category_name || undefined
            }))
          });
        } catch (e) {
          console.error('Failed to send GA begin_checkout event', e);
        }
      }

      if (trackingIds.fb) {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'InitiateCheckout', {
            value: safeValue,
            currency: 'DZD',
            content_ids: checkoutItems.map(item => String(item.id)),
            content_type: 'product',
            num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
          }, { eventID: eventId });
        }
        
        sendCapiEvent({
          eventName: 'InitiateCheckout',
          eventId: eventId,
          customData: {
            value: safeValue,
            currency: 'DZD',
            content_ids: checkoutItems.map(item => String(item.id)),
            content_type: 'product',
            num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
          }
        });
      }
    }
  }, [trackingIds.fb, checkoutItems, checkoutTotal]);`;

if (content.includes('initiateCheckoutTrackedRef')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched begin_checkout');
} else {
  console.log('Could not find target');
}
