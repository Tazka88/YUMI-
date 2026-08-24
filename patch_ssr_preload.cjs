const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // We need to replace the entire block building the preload URLs.
  // Using a regex to match the `if (firstSlide.mobile_image_url) {` up to the end of `if (desktopImage) {` block
  
  const newPreloadLogic = `
          if (firstSlide.mobile_image_url || firstSlide.image_url) {
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
          }`;

  const replaceRegex = /if\s*\(firstSlide\.mobile_image_url\)\s*\{\s*const hash = getHash\(firstSlide\.mobile_image_url\);[\s\S]*?fetchpriority="high">\`;\s*\}/;
  content = content.replace(replaceRegex, newPreloadLogic.trim());
  fs.writeFileSync(filepath, content);
  console.log('Patched ' + filepath);
}

patchFile('api/index.ts');
patchFile('server.ts');
