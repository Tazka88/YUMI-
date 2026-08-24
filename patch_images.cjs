const fs = require('fs');

// Patch src/lib/utils.ts
let utils = fs.readFileSync('src/lib/utils.ts', 'utf8');
utils = utils.replace(
/export const getResizedImageUrl = \(url: string \| null \| undefined, width: number\) => \{\s*if \(\!url\) return '';\s*if \(url\.startsWith\('\/api\/images\/'\)\) \{\s*return `\$\{url\}\$\{url\.includes\('\?'\) \? '&' : '\?'\}w=\$\{width\}`;\s*\}\s*return url;\s*\};/,
`export const getResizedImageUrl = (url: string | null | undefined, width: number, format = 'webp', q = 75) => {
  if (!url) return '';
  if (url.startsWith('/api/images/')) {
    return \`\${url}\${url.includes('?') ? '&' : '?'}w=\${width}&f=\${format}&q=\${q}\`;
  }
  return url;
};`
);
fs.writeFileSync('src/lib/utils.ts', utils);

// Patch src/components/Slider.tsx to add width/height and parameters
let slider = fs.readFileSync('src/components/Slider.tsx', 'utf8');
slider = slider.replace(
/<picture>\s*\{slide\.mobile_image_url && \(\s*<source media="\(max-width: 767px\)" srcSet=\{getResizedImageUrl\(slide\.mobile_image_url, 640\)\} \/>\s*\)\}\s*<img\s*src=\{slide\.image_url \? getResizedImageUrl\(slide\.image_url, 1600\) : getResizedImageUrl\(slide\.mobile_image_url!, 640\)\}\s*alt=\{slide\.title \|\| "Slide"\}\s*className="w-full h-full object-cover object-center"\s*referrerPolicy="no-referrer"\s*loading=\{index === 0 \? "eager" : "lazy"\}\s*fetchPriority=\{index === 0 \? "high" : "auto"\}\s*decoding=\{index === 0 \? "sync" : "async"\}\s*\/>\s*<\/picture>/,
`<picture>
            {slide.mobile_image_url ? (
              <source media="(max-width: 767px)" srcSet={getResizedImageUrl(slide.mobile_image_url, 768, 'webp', 75)} />
            ) : (
              <source media="(max-width: 767px)" srcSet={getResizedImageUrl(slide.image_url, 768, 'webp', 75)} />
            )}
            <img 
              src={slide.image_url ? getResizedImageUrl(slide.image_url, 1600, 'webp', 80) : getResizedImageUrl(slide.mobile_image_url!, 768, 'webp', 75)} 
              alt={slide.title || "Slide"} 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding={index === 0 ? "sync" : "async"}
              width={slide.image_url ? 1600 : 768}
              height={slide.image_url ? 500 : 800}
            />
          </picture>`
);
fs.writeFileSync('src/components/Slider.tsx', slider);

console.log('Patched frontend');
