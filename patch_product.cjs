const fs = require('fs');
const file = 'src/pages/Product.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    if (product && trackingIds.fb && viewContentTrackedRef.current !== product.id.toString()) {
      viewContentTrackedRef.current = product.id.toString();
      const eventId = generateEventId();
      const isPromoValid = (() => {
        if (product.promo_price === null || product.promo_price === undefined) return false;
        const now = new Date();
        if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
        if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
        return true;
      })();
      const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
      const safeValue = isNaN(currentPrice) || currentPrice <= 0 ? 1 : Number(currentPrice.toFixed(2));
      
      try {
        // Use window.fbq directly to ensure eventID is passed correctly (ReactPixel wrapper sometimes drops the 3rd argument)
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }, { eventID: eventId });
        }
        
        sendCapiEvent({
          eventName: 'ViewContent',
          eventId: eventId,
          customData: {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }
        });
      } catch (e) {
        console.error('Failed to send ViewContent event', e);
      }
    }
  }, [product?.id, trackingIds.fb]);`;

const replacement = `  useEffect(() => {
    if (product && viewContentTrackedRef.current !== product.id.toString()) {
      viewContentTrackedRef.current = product.id.toString();
      const eventId = generateEventId();
      const isPromoValid = (() => {
        if (product.promo_price === null || product.promo_price === undefined) return false;
        const now = new Date();
        if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
        if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
        return true;
      })();
      const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
      const safeValue = isNaN(currentPrice) || currentPrice <= 0 ? 1 : Number(currentPrice.toFixed(2));
      
      // GA4 view_item event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag("event", "view_item", {
            currency: "DZD",
            value: safeValue,
            items: [{
              item_id: product.id.toString(),
              item_name: product.name,
              price: currentPrice,
              quantity: 1,
              item_category: product.category_name || undefined
            }]
          });
        } catch (e) {
          console.error('Failed to send GA view_item event', e);
        }
      }

      if (trackingIds.fb) {
        try {
          // Use window.fbq directly to ensure eventID is passed correctly (ReactPixel wrapper sometimes drops the 3rd argument)
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'ViewContent', {
              content_name: product.name,
              content_ids: [product.id.toString()],
              content_type: 'product',
              value: safeValue,
              currency: 'DZD'
            }, { eventID: eventId });
          }
          
          sendCapiEvent({
            eventName: 'ViewContent',
            eventId: eventId,
            customData: {
              content_name: product.name,
              content_ids: [product.id.toString()],
              content_type: 'product',
              value: safeValue,
              currency: 'DZD'
            }
          });
        } catch (e) {
          console.error('Failed to send ViewContent event', e);
        }
      }
    }
  }, [product?.id, trackingIds.fb]);`;

content = content.replace(target, replacement);

const addToCartTarget = `    // Track Add to Cart
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag("event", "add_to_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: product.id.toString(),
            item_name: product.name,
            price: activePrice,
            quantity: quantity
          }]
        });
      } catch (e) {
        console.error('Failed to send GA add_to_cart event', e);
      }
    }`;

const addToCartReplacement = `    // Track Add to Cart
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag("event", "add_to_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: product.id.toString(),
            item_name: product.name,
            price: activePrice,
            quantity: quantity,
            item_category: product.category_name || undefined
          }]
        });
      } catch (e) {
        console.error('Failed to send GA add_to_cart event', e);
      }
    }`;

content = content.replace(addToCartTarget, addToCartReplacement);

fs.writeFileSync(file, content);
