const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            window.gtag("event", "purchase", {
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
          } catch (e) {`;

const replacement = `            window.gtag("event", "purchase", {
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
            
            // Explicit Google Ads Conversion
            // Triggered ONLY on successful purchase
            window.gtag("event", "ads_conversion_Paiement_1", {
              transaction_id: String(responseData.order_id || responseData.id),
              value: safeValue,
              currency: "DZD"
            });
            
            // Standard conversion fallback
            window.gtag("event", "conversion", {
              transaction_id: String(responseData.order_id || responseData.id),
              value: safeValue,
              currency: "DZD"
            });
          } catch (e) {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched checkout for ads');
