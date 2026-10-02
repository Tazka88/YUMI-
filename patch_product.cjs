const fs = require('fs');

let content = fs.readFileSync('src/pages/Product.tsx', 'utf8');

const oldBlock = `<div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-orange-600">{formatPrice(product.promo_price)}</span>
                  <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.price)}</span>
                </div>`;

const newBlock = `<div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-orange-600">{formatPrice(product.promo_price)}</span>
                  <span className="sr-only"> au lieu de </span>
                  <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.price)}</span>
                </div>`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('src/pages/Product.tsx', content);
    console.log('Patched Product.tsx');
} else {
    console.log('Failed to patch Product.tsx, block not found');
}
