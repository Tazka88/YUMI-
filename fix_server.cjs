const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Fix Title Formatting: ` - ZORANDO` -> ` | Zorando`
code = code.replace(/`${product\.name} - ZORANDO`/g, "`${product.name} | Zorando`");
code = code.replace(/`${category\.name} \| ZORANDO`/g, "`${category.name} | Zorando`");
code = code.replace(/`${subcat\.name} \| ZORANDO`/g, "`${subcat.name} | Zorando`");
code = code.replace(/`${subSubcat\.name} \| ZORANDO`/g, "`${subSubcat.name} | Zorando`");
code = code.replace(/`${brand\.name} - ZORANDO`/g, "`${brand.name} | Zorando`");
code = code.replace(/ - ZORANDO/g, " | Zorando");

// 2. Fix global-nav
const regexGlobalNav = /<nav id="global-nav" style="display:none;">/;
code = code.replace(regexGlobalNav, '<nav id="global-nav" class="sr-only">');

// 4. Fix Meta Robots
// Inside let seoTags = ... we need to append the robots tag.
const regexSeoTags = /let seoTags = `([\s\S]*?)`;/;
if(regexSeoTags.test(code)) {
    code = code.replace(regexSeoTags, (match, p1) => {
        let newTags = p1 + `\n          <meta data-rh="true" name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;
        return `let seoTags = \`${newTags}\`;`;
    });
    console.log("Meta robots tag injected into seoTags in server.ts.");
}

fs.writeFileSync('server.ts', code);
console.log("server.ts updated.");
