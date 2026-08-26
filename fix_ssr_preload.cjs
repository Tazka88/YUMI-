const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const targetRegex = /if \(firstSlide\) \{\s*if \(firstSlide\.mobile_image_url\) \{\s*headHtml \+= `\\n\s*<link rel="preload" as="image" href="\$\{firstSlide\.mobile_image_url\}" media="\(max-width: 767px\)" fetchpriority="high">`;\s*\} else if \(firstSlide\.image_url\) \{\s*headHtml \+= `\\n\s*<link rel="preload" as="image" href="\$\{firstSlide\.image_url\}" media="\(max-width: 767px\)" fetchpriority="high">`;\s*\}\s*const desktopImage = firstSlide\.image_url \|\| firstSlide\.mobile_image_url;\s*if \(desktopImage\) \{\s*headHtml \+= `\\n\s*<link rel="preload" as="image" href="\$\{desktopImage\}" media="\(min-width: 768px\)" fetchpriority="high">`;\s*\}\s*\}/;

    const newCode = `if (firstSlide) {
          const getImg = (u, w) => (u && u.startsWith('/api/images/')) ? \`\${u}?w=\${w}&q=80\` : u;
          const mobileUrl = firstSlide.mobile_image_url || firstSlide.image_url;
          if (mobileUrl) {
            if (mobileUrl.startsWith('/api/images/')) {
               const srcSet = \`\${getImg(mobileUrl, 400)} 400w, \${getImg(mobileUrl, 800)} 800w, \${getImg(mobileUrl, 1200)} 1200w\`;
               headHtml += \`\\n          <link rel="preload" as="image" imagesrcset="\${srcSet}" imagesizes="100vw" media="(max-width: 767px)" fetchpriority="high">\`;
            } else {
               headHtml += \`\\n          <link rel="preload" as="image" href="\${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">\`;
            }
          }

          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            headHtml += \`\\n          <link rel="preload" as="image" href="\${getImg(desktopImage, 1600)}" media="(min-width: 768px)" fetchpriority="high">\`;
          }
        }`;

    if (targetRegex.test(code)) {
        code = code.replace(targetRegex, newCode);
        fs.writeFileSync(filePath, code);
        console.log(filePath + " updated.");
    } else {
        console.log("Regex did not match in " + filePath);
    }
}

fixFile('api/index.ts');
fixFile('server.ts');
