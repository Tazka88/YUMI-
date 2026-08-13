const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            // Explicit Google Ads Conversion
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
            });`;

const replacement = `            // Explicit Google Ads Conversion (from Google Ads interface)
            window.gtag('event', 'conversion', {
              'send_to': 'AW-18384476935/KcjbCLSx-98cEIe2s75E',
              'value': safeValue,
              'currency': 'DZD',
              'transaction_id': String(responseData.order_id || responseData.id)
            });`;

if (content.includes('ads_conversion_Paiement_1')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched Checkout.tsx with exact AW snippet');
} else {
  console.log('Target not found in Checkout.tsx');
}
