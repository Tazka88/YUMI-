const fs = require('fs');

let content = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');

// The block to replace
const oldBlock = `<div className="flex items-end gap-1.5 sm:gap-2">
                <div className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.promo_price!)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 line-through mb-0.5 sm:mb-1">{formatPrice(product.price)}</div>
              </div>`;

const newBlock = `<div className="flex items-end gap-1.5 sm:gap-2">
                <div className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.promo_price!)}</div>
                <span className="sr-only"> au lieu de </span>
                <div className="text-[10px] sm:text-xs text-gray-500 line-through mb-0.5 sm:mb-1">{formatPrice(product.price)}</div>
              </div>`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('src/components/ProductCard.tsx', content);
    console.log('Patched ProductCard.tsx');
} else {
    console.log('Failed to patch ProductCard.tsx, block not found');
}
