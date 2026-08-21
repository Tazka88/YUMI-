const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const target = `        const categories = await sql\`SELECT name, slug FROM categories\`;
        const brands = await sql\`SELECT name, slug FROM brands\`;
        headHtml = \`
          <link rel="canonical" href="\${baseUrl}\${req.path}" />
          <link rel="preload" as="image" href="/api/hero-banners/first-image/mobile" media="(max-width: 767px)" fetchpriority="high">
          <link rel="preload" as="image" href="/api/hero-banners/first-image/desktop" media="(min-width: 768px)" fetchpriority="high">
        \`;`;

const replacement = `        const categories = await sql\`SELECT name, slug FROM categories\`;
        const brands = await sql\`SELECT name, slug FROM brands\`;
        const [firstSlide] = await sql\`SELECT id, image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC, id ASC LIMIT 1\`;

        headHtml = \`\\n          <link rel="canonical" href="\${baseUrl}\${req.path}" />\`;

        if (firstSlide) {
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
            const mobileUrl = \`/api/images/slider_images/\${firstSlide.id}/mobile_image_url\${hash ? '?v=' + hash + '&' : '?'}w=640\`;
            headHtml += \`\\n          <link rel="preload" as="image" href="\${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">\`;
          }

          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            const hash = getHash(desktopImage);
            const field = firstSlide.image_url ? 'image_url' : 'mobile_image_url';
            const width = firstSlide.image_url ? 1600 : 640;
            const desktopUrl = \`/api/images/slider_images/\${firstSlide.id}/\${field}\${hash ? '?v=' + hash + '&' : '?'}w=\${width}\`;
            headHtml += \`\\n          <link rel="preload" as="image" href="\${desktopUrl}" media="(min-width: 768px)" fetchpriority="high">\`;
          }
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('api/index.ts', code);
