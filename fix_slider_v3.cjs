const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

// Remove decoding="async" from LCP image, add style={{ display: 'block' }}, and make transition only apply to non-first items on first load, or just keep it simple:
// For the LCP image specifically, we want index 0 to be rendered eagerly.
const imgRegex = /<img\s+src=\{slide\.image_url \|\| slide\.mobile_image_url\}\s+alt=\{slide\.title \|\| "Slide"\}\s+className="w-full h-full object-cover object-center"\s+referrerPolicy="no-referrer"\s+loading="eager"\s+fetchPriority="high"\s+decoding="async"\s+width=\{slide\.image_url \? 1600 : 768\}\s+height=\{slide\.image_url \? 500 : 800\}\s+\/>/g;

const newImg = `<img 
              src={slide.image_url || slide.mobile_image_url} 
              alt={slide.title || "Slide"} 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              {...(index !== 0 ? { decoding: "async" } : {})}
              width={slide.image_url ? 1600 : 768}
              height={slide.image_url ? 500 : 800}
              style={{ display: 'block' }}
            />`;

content = content.replace(imgRegex, newImg);

// Fix the container animation on the first slide. 
// If it's the first slide (index === 0) and currentSlide === 0, it shouldn't be delayed by transition-opacity initially.
// Actually, it's fine as long as opacity is 100.
// Let's replace the wrapping div class to ensure index 0 is always rendered immediately.
const wrapRegex = /className=\{\`absolute inset-0 transition-opacity duration-1000 ease-in-out \$\{\s*index === currentSlide \? 'opacity-100 z-10' : 'opacity-0 z-0'\s*\}\`\}/g;

const newWrap = `className={\`absolute inset-0 transition-opacity duration-1000 ease-in-out \${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }\`}`; // Keep as is, it's fine, but let's make sure decoding is removed.

content = content.replace(wrapRegex, newWrap);

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Fixed Slider.tsx decoding and style");
