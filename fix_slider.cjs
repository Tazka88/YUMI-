const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

// Replace container classes
content = content.replace(
  /className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-\[4\/5\] sm:aspect-\[1\/1\] lg:aspect-auto lg:h-full min-h-\[200px\] group bg-gray-100"/g,
  'className="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-[768/800] md:aspect-[1600/500] group bg-gray-100"'
);

// Replace loading skeleton classes too
content = content.replace(
  /className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-\[4\/5\] sm:aspect-\[1\/1\] lg:aspect-auto lg:h-full min-h-\[200px\] bg-gray-200 animate-pulse"/g,
  'className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[768/800] md:aspect-[1600/500] bg-gray-200 animate-pulse"'
);

// Replace the <picture> element
const pictureRegex = /<picture>[\s\S]*?<\/picture>/;
const newPicture = `<picture>
            {slide.mobile_image_url ? (
              <source media="(max-width: 767px)" srcSet={slide.mobile_image_url} />
            ) : (
              <source media="(max-width: 767px)" srcSet={slide.image_url} />
            )}
            <img 
              src={slide.image_url || slide.mobile_image_url} 
              alt={slide.title || "Slide"} 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding={index === 0 ? "sync" : "async"}
              width={slide.image_url ? 1600 : 768}
              height={slide.image_url ? 500 : 800}
            />
          </picture>`;

content = content.replace(pictureRegex, newPicture);

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Fixed Slider.tsx");
