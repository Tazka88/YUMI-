const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("let keywords = 'boutique en ligne")) {
  code = code.replace(
    "let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';",
    "let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';\n        let keywords = 'boutique en ligne, e-commerce, Algérie, achat en ligne, électroménager, mode, beauté, maison, ZORANDO';"
  );
}

// Update category/subcat blocks to use keywords
code = code.replace(
  "title = categorySEOData[slug].title;\n              description = categorySEOData[slug].description;",
  "title = categorySEOData[slug].title;\n              description = categorySEOData[slug].description;\n              if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;"
);

code = code.replace(
  "title = categorySEOData[slug].title;\n                description = categorySEOData[slug].description;",
  "title = categorySEOData[slug].title;\n                description = categorySEOData[slug].description;\n                if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;"
);

code = code.replace(
  "title = categorySEOData[slug].title;\n                  description = categorySEOData[slug].description;",
  "title = categorySEOData[slug].title;\n                  description = categorySEOData[slug].description;\n                  if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;"
);

// Add the replace for keywords
if (!code.includes("name=\"keywords\"")) {
  code = code.replace(
    "finalHtml = finalHtml.replace(/<meta.*?name=\"description\".*?>/, `<meta data-rh=\"true\" name=\"description\" content=\"${description}\" />`);",
    "finalHtml = finalHtml.replace(/<meta.*?name=\"description\".*?>/, `<meta data-rh=\"true\" name=\"description\" content=\"${description}\" />`);\n        finalHtml = finalHtml.replace(/<meta.*?name=\"keywords\".*?>/, `<meta data-rh=\"true\" name=\"keywords\" content=\"${keywords}\" />`);"
  );
}

fs.writeFileSync('server.ts', code);
console.log("server.ts patched successfully");
