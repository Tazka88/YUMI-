const fs = require('fs');

let content = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');

content = content.replace(
  /promo_price: number \| null;/,
  `promo_price: number | null;\n  promo_price_start_date?: string | null;\n  promo_price_end_date?: string | null;`
);

fs.writeFileSync('src/components/ProductCard.tsx', content);
