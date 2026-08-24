const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

const startMarker = `        if (firstSlide) {
          const getHash = (image) => {`;
const endMarker = `        }

        seoHtml = '';`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx > -1 && endIdx > -1) {
  const replacement = `        if (firstSlide) {
          if (firstSlide.mobile_image_url) {
            headHtml += \`\\n          <link rel="preload" as="image" href="\${firstSlide.mobile_image_url}" media="(max-width: 767px)" fetchpriority="high">\`;
          } else if (firstSlide.image_url) {
            headHtml += \`\\n          <link rel="preload" as="image" href="\${firstSlide.image_url}" media="(max-width: 767px)" fetchpriority="high">\`;
          }

          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            headHtml += \`\\n          <link rel="preload" as="image" href="\${desktopImage}" media="(min-width: 768px)" fetchpriority="high">\`;
          }
`;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('api/index.ts', content);
  console.log("Fixed api/index.ts");
} else {
  console.log("Could not find markers in api/index.ts");
}
