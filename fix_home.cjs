const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add React.lazy and Suspense imports if not present
if (!content.includes('import React, { useState, useEffect, useRef, lazy, Suspense }')) {
  content = content.replace('import React, { useState, useEffect, useRef }', 'import React, { useState, useEffect, useRef, lazy, Suspense }');
}

// Add ProductGrid lazy import
if (!content.includes('const ProductGrid = lazy(() => import(\'../components/ProductGrid\'));')) {
  content = content.replace(
    'import { ProductCard } from \'../components/ProductCard\';',
    `import { ProductCard } from '../components/ProductCard';\nconst ProductGrid = lazy(() => import('../components/ProductGrid'));`
  );
}

// Add Skeleton
if (!content.includes('const GridSkeleton = () =>')) {
  const skeleton = `
const GridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="aspect-[4/5] bg-gray-100 rounded-xl animate-pulse"></div>
    ))}
  </div>
);
`;
  content = content.replace('const THEME_IMAGES', skeleton + '\nconst THEME_IMAGES');
}

// Now replace rendering of ProductCard arrays in dynamic sections with Suspense + ProductGrid
// e.g.:
/*
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {bestSellers.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
*/
// We can use a regex to replace the sections. Or just replace known patterns.

content = content.replace(
  /<div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">\s*\{promotions\.slice\(0, 10\)\.map\(\(p, i\) => \(\s*<div key=\{p\.id\} className="w-\[160px\] sm:w-\[200px\] shrink-0 snap-start md:w-auto">\s*<ProductCard product=\{p\} priority=\{i < 4\} isFlashSale=\{true\} \/>\s*<\/div>\s*\)\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={promotions.slice(0, 10)} isCarousel={true} isFlashSale={true} /></Suspense>`
);

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">\s*\{bestSellers\.slice\(0, 10\)\.map\(\(p, i\) => <ProductCard key=\{p\.id\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={bestSellers.slice(0, 10)} /></Suspense>`
);

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">\s*\{popularProducts\.slice\(0, 10\)\.map\(\(p, i\) => <ProductCard key=\{p\.id\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={popularProducts.slice(0, 10)} /></Suspense>`
);

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">\s*\{newProducts\.slice\(0, 10\)\.map\(\(p, i\) => <ProductCard key=\{p\.id\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={newProducts.slice(0, 10)} /></Suspense>`
);

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">\s*\{randomProducts\.slice\(0, 10\)\.map\(\(p, i\) => <ProductCard key=\{p\.id\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={randomProducts.slice(0, 10)} /></Suspense>`
);

content = content.replace(
  /<div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">\s*\{sectionProducts\.map\(\(p, i\) => \(\s*<div key=\{\`\$\{section\.id\}-\$\{p\.id\}\`\} className="w-\[160px\] sm:w-\[200px\] shrink-0 snap-start md:w-auto">\s*<ProductCard product=\{p\} priority=\{i < 4\} \/>\s*<\/div>\s*\)\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={sectionProducts} isCarousel={true} /></Suspense>`
);

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">\s*\{sectionProducts\.map\(\(p, i\) => <ProductCard key=\{\`\$\{section\.id\}-\$\{p\.id\}\`\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/g,
  `<Suspense fallback={<GridSkeleton />}><ProductGrid products={sectionProducts} /></Suspense>`
);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log("Fixed Home.tsx Suspense");
