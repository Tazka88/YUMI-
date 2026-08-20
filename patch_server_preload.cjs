const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const target = `          headHtml += \`
            <link rel="preload" as="image" href="/api/hero-banners/first-image/mobile" media="(max-width: 767px)" fetchpriority="high">
            <link rel="preload" as="image" href="/api/hero-banners/first-image/desktop" media="(min-width: 768px)" fetchpriority="high">
          \`;`;

const replacement = `          const [firstSlide] = await sql\`SELECT id, image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC LIMIT 1\`;
          if (firstSlide) {
            const getHash = (image) => {
              if (!image) return '';
              const vMatch = image.match(/v=([^&]+)/);
              if (vMatch && vMatch[1]) return vMatch[1];
              const parts = image.split('/');
              const lastPart = parts[parts.length - 1];
              return lastPart ? lastPart.substring(Math.max(0, lastPart.length - 10)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 6) : '';
            };
            
            if (firstSlide.mobile_image_url) {
              const hash = getHash(firstSlide.mobile_image_url);
              const mobileUrl = \`/api/images/slider_images/\${firstSlide.id}/mobile_image_url\${hash ? '?v=' + hash + '&' : '?'}w=640\`;
              headHtml += \`<link rel="preload" as="image" href="\${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">\`;
            }
            
            const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
            if (desktopImage) {
              const hash = getHash(desktopImage);
              const field = firstSlide.image_url ? 'image_url' : 'mobile_image_url';
              const desktopUrl = \`/api/images/slider_images/\${firstSlide.id}/\${field}\${hash ? '?v=' + hash + '&' : '?'}w=1600\`;
              headHtml += \`<link rel="preload" as="image" href="\${desktopUrl}" media="(min-width: 768px)" fetchpriority="high">\`;
            }
          }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content);
  console.log("Success");
} else {
  console.log("Target not found");
}
