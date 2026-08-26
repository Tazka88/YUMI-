const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const newCode = `if (firstSlide) {
          const getImg = (u, w) => (u && u.startsWith('/api/images/')) ? \`\${u}?w=\${w}&q=80\` : u;
          
          let pictureHtml = '';
          if (firstSlide.mobile_image_url) {
             const mUrl = firstSlide.mobile_image_url;
             const srcSet = mUrl.startsWith('/api/images/') ? \`\${getImg(mUrl, 400)} 400w, \${getImg(mUrl, 800)} 800w, \${getImg(mUrl, 1200)} 1200w\` : mUrl;
             pictureHtml += \`<source media="(max-width: 767px)" srcset="\${srcSet}" sizes="100vw" />\`;
          }
          
          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            pictureHtml += \`<img 
              src="\${getImg(desktopImage, 1600)}" 
              alt="\${firstSlide.title || 'Slide'}" 
              loading="eager" 
              fetchpriority="high"
              decoding="sync"
              class="w-full h-full object-cover object-center slider-image"
              style="display: block; opacity: 1; z-index: 1; visibility: visible;"
            />\`;
          }

          rootHtml = \`
            <div class="mb-8 lg:mb-0 rounded-xl overflow-hidden shadow-md relative w-full aspect-[768/800] md:aspect-[1600/500] group bg-gray-100 slider-container no-animation" style="content-visibility: visible; contain: layout;">
              <div class="absolute inset-0 opacity-100 z-10" style="opacity: 1; z-index: 1; visibility: visible;">
                <picture>
                  \${pictureHtml}
                </picture>
              </div>
            </div>
          \`;
        }`;

    code = code.replace('// Preload removed (Plan B) to avoid double-download and resource starvation.', newCode);
    fs.writeFileSync(filePath, code);
    console.log(filePath + " updated (root injection added).");
}

fixFile('api/index.ts');
fixFile('server.ts');
