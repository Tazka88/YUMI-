const fs = require('fs');

// Patch api/index.ts
let apiCode = fs.readFileSync('api/index.ts', 'utf8');

if (!apiCode.includes("import { categorySEOData }")) {
  apiCode = apiCode.replace(
    "import { sql } from '../src/db/setup.js';",
    "import { sql } from '../src/db/setup.js';\nimport { categorySEOData } from '../src/utils/seoData.js';"
  );
}

// Add keywords variable
if (!apiCode.includes("let keywords = 'boutique en ligne")) {
  apiCode = apiCode.replace(
    "let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';",
    "let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';\n    let keywords = 'boutique en ligne, e-commerce, Algérie, achat en ligne, électroménager, mode, beauté, maison, ZORANDO';"
  );
}

// Update category block
const catTarget = `        if (category) {
          title = \`\${category.name} - ZORANDO\`;
          description = category.description || \`Découvrez nos produits dans la catégorie \${category.name}.\`;`;
const catReplace = `        if (category) {
          title = categorySEOData[slug]?.title || \`\${category.name} - ZORANDO\`;
          description = categorySEOData[slug]?.description || category.description || \`Découvrez nos produits dans la catégorie \${category.name}.\`;
          if (categorySEOData[slug]?.keywords) keywords = categorySEOData[slug].keywords;`;
apiCode = apiCode.replace(catTarget, catReplace);

// Update subcat block
const subcatTarget = `          if (subcat) {
            title = \`\${subcat.name} - ZORANDO\`;`;
const subcatReplace = `          if (subcat) {
            title = categorySEOData[slug]?.title || \`\${subcat.name} - ZORANDO\`;
            description = categorySEOData[slug]?.description || \`Découvrez nos produits dans la catégorie \${subcat.name}.\`;
            if (categorySEOData[slug]?.keywords) keywords = categorySEOData[slug].keywords;`;
apiCode = apiCode.replace(subcatTarget, subcatReplace);

// Fix regexes
const regexTarget = `    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml);
    finalHtml = finalHtml.replace(/<title>.*?<\\/title>/, \`<title>\${title}</title>\`);
    finalHtml = finalHtml.replace(/<meta name="description" content=".*?" \\/>/, \`<meta name="description" content="\${description}" />\`);
    
    // Update OG Tags dynamically
    finalHtml = finalHtml.replace(/<meta property="og:title" content=".*?" \\/>/g, \`<meta property="og:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta property="og:description" content=".*?" \\/>/g, \`<meta property="og:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta property="og:image" content=".*?" \\/>/g, \`<meta property="og:image" content="\${ogImage}" />\`);
    finalHtml = finalHtml.replace(/<meta property="og:url" content=".*?" \\/>/g, \`<meta property="og:url" content="\${ogUrl}" />\`);
    finalHtml = finalHtml.replace(/<meta name="twitter:title" content=".*?" \\/>/g, \`<meta name="twitter:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta name="twitter:description" content=".*?" \\/>/g, \`<meta name="twitter:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta name="twitter:image" content=".*?" \\/>/g, \`<meta name="twitter:image" content="\${ogImage}" />\`);`;

const regexReplace = `    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml);
    finalHtml = finalHtml.replace(/<title.*?>.*?<\\/title>/, \`<title data-rh="true">\${title}</title>\`);
    finalHtml = finalHtml.replace(/<meta.*?name="description".*?>/, \`<meta data-rh="true" name="description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="keywords".*?>/, \`<meta data-rh="true" name="keywords" content="\${keywords}" />\`);
    
    // Update OG Tags dynamically
    finalHtml = finalHtml.replace(/<meta.*?property="og:title".*?>/g, \`<meta data-rh="true" property="og:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:description".*?>/g, \`<meta data-rh="true" property="og:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:image".*?>/g, \`<meta data-rh="true" property="og:image" content="\${ogImage}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:url".*?>/g, \`<meta data-rh="true" property="og:url" content="\${ogUrl}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:title".*?>/g, \`<meta data-rh="true" name="twitter:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:description".*?>/g, \`<meta data-rh="true" name="twitter:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:image".*?>/g, \`<meta data-rh="true" name="twitter:image" content="\${ogImage}" />\`);`;

apiCode = apiCode.replace(regexTarget, regexReplace);

fs.writeFileSync('api/index.ts', apiCode);
console.log("api/index.ts patched successfully.");

