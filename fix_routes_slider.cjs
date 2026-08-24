const fs = require('fs');
let content = fs.readFileSync('src/api/routes.ts', 'utf8');

const target = `        sliderImages.forEach((s: any) => {
      s.image_url = processImage('slider_images', s.id, 'image_url', s.image_url);
      if (s.mobile_image_url) {
        s.mobile_image_url = processImage('slider_images', s.id, 'mobile_image_url', s.mobile_image_url);
      }
    });`;

if (content.includes(target)) {
  content = content.replace(target, `        // Bypassing processImage for slider_images to use direct URLs for LCP`);
  fs.writeFileSync('src/api/routes.ts', content);
  console.log("Fixed routes.ts - removed processImage for slider");
} else {
  console.log("Target not found in routes.ts");
}
