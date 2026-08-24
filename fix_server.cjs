const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The duplicate block starts at `const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;` and ends before `seoHtml = '';`
// Let's replace the whole preload section properly.
const startMarker = `          if (firstSlide) {
            const getHash = (image) => {`;
const endMarker = `          seoHtml = ''; // No hidden content anymore`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx > -1 && endIdx > -1) {
  const replacement = `          if (firstSlide) {
            const getHash = (image) => {
              if (!image) return '';
              const vMatch = image.match(/v=([^&]+)/);
              if (vMatch && vMatch[1]) return vMatch[1];
              let code = 0;
              for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
              return Math.abs(code).toString(36);
            };

            if (firstSlide.mobile_image_url) {
              const hash = getHash(firstSlide.mobile_image_url);
              const qString = hash ? '?v=' + hash + '&' : '?';
              const mobileUrl = \`/api/images/slider_images/\${firstSlide.id}/mobile_image_url\${qString}w=768&f=webp&q=75\`;
              headHtml += \`\\n          <link rel="preload" as="image" href="\${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">\`;
            } else if (firstSlide.image_url) {
              const hash = getHash(firstSlide.image_url);
              const qString = hash ? '?v=' + hash + '&' : '?';
              const mobileUrl = \`/api/images/slider_images/\${firstSlide.id}/image_url\${qString}w=768&f=webp&q=75\`;
              headHtml += \`\\n          <link rel="preload" as="image" href="\${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">\`;
            }

            const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
            if (desktopImage) {
              const hash = getHash(desktopImage);
              const field = firstSlide.image_url ? 'image_url' : 'mobile_image_url';
              const width = firstSlide.image_url ? 1600 : 768;
              const quality = firstSlide.image_url ? 80 : 75;
              const qString = hash ? '?v=' + hash + '&' : '?';
              const desktopUrl = \`/api/images/slider_images/\${firstSlide.id}/\${field}\${qString}w=\${width}&f=webp&q=\${quality}\`;
              headHtml += \`\\n          <link rel="preload" as="image" href="\${desktopUrl}" media="(min-width: 768px)" fetchpriority="high">\`;
            }
          }
          
`;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('server.ts', content);
  console.log("Fixed server.ts");
} else {
  console.log("Could not find markers in server.ts");
}
