const fs = require('fs');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    const targetRegex = /if \(firstSlide\) \{\s*const getImg = \(u, w\) => \(u && u\.startsWith\('\/api\/images\/'\)\) \? `\$\{u\}\?w=\$\{w\}&q=80` : u;\s*const mobileUrl = firstSlide\.mobile_image_url \|\| firstSlide\.image_url;\s*if \(mobileUrl\) \{\s*if \(mobileUrl\.startsWith\('\/api\/images\/'\)\) \{\s*const srcSet = `\$\{getImg\(mobileUrl, 400\)\} 400w, \$\{getImg\(mobileUrl, 800\)\} 800w, \$\{getImg\(mobileUrl, 1200\)\} 1200w`;\s*headHtml \+= `\\n\s*<link rel="preload" as="image" imagesrcset="\$\{srcSet\}" imagesizes="100vw" media="\(max-width: 767px\)" fetchpriority="high">`;\s*\} else \{\s*headHtml \+= `\\n\s*<link rel="preload" as="image" href="\$\{mobileUrl\}" media="\(max-width: 767px\)" fetchpriority="high">`;\s*\}\s*\}\s*const desktopImage = firstSlide\.image_url \|\| firstSlide\.mobile_image_url;\s*if \(desktopImage\) \{\s*headHtml \+= `\\n\s*<link rel="preload" as="image" href="\$\{getImg\(desktopImage, 1600\)\}" media="\(min-width: 768px\)" fetchpriority="high">`;\s*\}\s*\}/;

    if (targetRegex.test(code)) {
        code = code.replace(targetRegex, '// Preload removed (Plan B) to avoid double-download and resource starvation.');
        fs.writeFileSync(filePath, code);
        console.log(filePath + " updated (preload removed).");
    } else {
        console.log("Regex did not match in " + filePath);
    }
}

fixFile('api/index.ts');
fixFile('server.ts');
