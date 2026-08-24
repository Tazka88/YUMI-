const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

// Container
content = content.replace(
  /className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-\[768\/800\] md:aspect-\[1600\/500\] group bg-gray-100"/g,
  'className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-[768/800] md:aspect-[1600/500] group bg-gray-100 slider-container no-animation"'
);

// LCP Image
content = content.replace(
  /className="w-full h-full object-cover object-center"/g,
  'className={`w-full h-full object-cover object-center ${index === 0 ? "slider-image" : ""}`}'
);

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Slider modified 6");
