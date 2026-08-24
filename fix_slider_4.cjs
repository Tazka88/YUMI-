const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

// Container styles
content = content.replace(
  /className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-\[768\/800\] md:aspect-\[1600\/500\] group bg-gray-100"/g,
  'className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-[768/800] md:aspect-[1600/500] group bg-gray-100"\n      style={{ contentVisibility: "visible", contain: "layout" } as React.CSSProperties}'
);

// Slide wrapper classes
content = content.replace(
  /className=\{\`absolute inset-0 transition-opacity duration-1000 ease-in-out \$\{\s*index === currentSlide \? 'opacity-100 z-10' : 'opacity-0 z-0'\s*\}\`\}/g,
  'className={`absolute inset-0 ${index === 0 ? "opacity-100 z-10" : "opacity-0 z-0"} ${index !== 0 || currentSlide !== 0 ? "transition-opacity duration-1000 ease-in-out" : ""} ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}\n          style={index === 0 ? { opacity: 1, zIndex: 1, visibility: "visible" } : {}}'
);

// Img style
content = content.replace(
  /style=\{\{ display: 'block' \}\}/g,
  'style={index === 0 ? { display: "block", opacity: 1, zIndex: 1, visibility: "visible" } : {}}'
);

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Slider modified");
