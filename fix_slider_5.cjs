const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

// Replace the slide wrapper style
content = content.replace(
  /style=\{index === 0 \? \{ opacity: 1, zIndex: 1, visibility: "visible" \} : \{\}\}/g,
  'style={index === 0 && currentSlide === 0 ? { opacity: 1, zIndex: 1, visibility: "visible", animation: "none", transition: "none" } : {}}'
);

// Replace the img style
content = content.replace(
  /style=\{index === 0 \? \{ display: "block", opacity: 1, zIndex: 1, visibility: "visible" \} : \{\}\}/g,
  'style={index === 0 ? { display: "block", opacity: 1, zIndex: 1, visibility: "visible" } : {}}'
);

// Replace the wrapper class to be cleaner
content = content.replace(
  /className=\{\`absolute inset-0 \$\{index === 0 \? "opacity-100 z-10" : "opacity-0 z-0"\} \$\{index !== 0 \|\| currentSlide !== 0 \? "transition-opacity duration-1000 ease-in-out" : ""\} \$\{index === currentSlide \? "opacity-100 z-10" : "opacity-0 z-0"\}\`\}/g,
  'className={`absolute inset-0 ${index === 0 && currentSlide === 0 ? "opacity-100 z-10" : `transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}`}'
);

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Slider modified 5");
