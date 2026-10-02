import React from 'react';
import { ProductCard } from './ProductCard';

export default function ProductGrid({ 
  products, 
  isCarousel = false, 
  isFlashSale = false 
}: { 
  products: any[], 
  isCarousel?: boolean, 
  isFlashSale?: boolean 
}) {
  if (isCarousel) {
    return (
      <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">
        {products.map((p, i) => (
          <div key={p.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start md:w-auto">
            <ProductCard product={p} priority={false} isFlashSale={isFlashSale} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={false} isFlashSale={isFlashSale} />
      ))}
    </div>
  );
}
