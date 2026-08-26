const fs = require('fs');
let code = fs.readFileSync('src/components/Slider.tsx', 'utf8');

const target = /srcSet=\{slide\.image_url && slide\.image_url\.startsWith\('\/api\/images\/'\) \? `\\\$\\{getResizedImageUrl\(slide\.image_url, 400\)\\} 400w, \\\$\\{getResizedImageUrl\(slide\.image_url, 800\)\\} 800w` : slide\.image_url\}/;
const replacement = "srcSet={slide.image_url && slide.image_url.startsWith('/api/images/') ? `${getResizedImageUrl(slide.image_url, 400)} 400w, ${getResizedImageUrl(slide.image_url, 800)} 800w, ${getResizedImageUrl(slide.image_url, 1200)} 1200w` : slide.image_url}";

if (target.test(code)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/Slider.tsx', code);
    console.log("Slider srcset fixed.");
} else {
    console.log("Regex didn't match.");
}
