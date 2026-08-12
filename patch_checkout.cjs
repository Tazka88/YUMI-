const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const beginCheckoutTarget = `  useEffect(() => {
    if (trackingIds.fb && checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;`;

const beginCheckoutReplacement = `  useEffect(() => {
    if (checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const safeValue = isNaN(checkoutTotal) || checkoutTotal <= 0 ? 1 : Number(Number(checkoutTotal).toFixed(2));
      
      // GA4 begin_checkout
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
      
      if (trackingIds.fb) {`;

content = content.replace(beginCheckoutTarget, beginCheckoutReplacement);

const fbEndTarget = `              }, { eventID: eventId });
            }
          }
        });
      }
    }
  }, [checkoutItems, checkoutTotal, trackingIds.fb]);`;

const fbEndReplacement = `              }, { eventID: eventId });
            }
          }
        });
      }
    }
  }, [checkoutItems, checkoutTotal, trackingIds.fb]);`;
// actually I just need to close the `if (trackingIds.fb) {` properly. Wait.
// Ah, the original code had:
/*
  useEffect(() => {
    if (trackingIds.fb && checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const eventId = generateEventId();
...
      }
    }
  }, [checkoutItems, checkoutTotal, trackingIds.fb]);
*/
// The closing brace is already there for the if statement. Let's just do a simple replacement for the start, then add a closing brace.
