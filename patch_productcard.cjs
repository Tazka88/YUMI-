const fs = require('fs');

let content = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');

// Replace the image wrapper and the text block container
content = content.replace(
  '<div className="relative block h-36 sm:h-48 overflow-hidden">',
  '<div className="relative block aspect-[4/5] sm:aspect-square bg-gray-50/50 overflow-hidden shrink-0">'
);

content = content.replace(
  'className={`w-full h-full object-contain p-4 bg-white group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? \'opacity-50 grayscale\' : \'\'}`}',
  'className={`w-full h-full object-contain p-2 sm:p-3 drop-shadow-sm group-hover:scale-110 transition-transform duration-500 mix-blend-multiply ${isOutOfStock ? \'opacity-50 grayscale\' : \'\'}`}'
);

content = content.replace(
  '<div className="p-3 sm:p-4 flex flex-col flex-grow">',
  '<div className="p-2 sm:p-3 flex flex-col flex-grow bg-white">'
);

fs.writeFileSync('src/components/ProductCard.tsx', content);
console.log('Patched ProductCard.tsx');
