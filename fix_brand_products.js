const fs = require('fs');
let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

// Replace the condition
content = content.replace(
  "if (brand.slug === 'electromenager-moulinex-algerie' && currentCategory) {",
  "if (currentCategory) {"
);

// Replace Moulinex with ${brand.name}
content = content.replace(/Moulinex/g, "${brand.name}");

// Fix the SEO intro and FAQ texts to be dynamic
content = content.replace(/électriques \$\{brand\.name\}/g, "${brand.name}");
content = content.replace(/autres produits \$\{brand\.name\}/g, "autres produits ${brand.name}");

// Fix the breadcrumbs part
content = content.replace(
  `{ "@type": "ListItem", "position": 3, "name": "\${brand.name}", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie" },`,
  `{ "@type": "ListItem", "position": 3, "name": brand.name, "item": \`https://www.zorando.com/brands/\${brand.slug}\` },`
);

content = content.replace(
  `"item": \`https://www.zorando.com/brands/electromenager-moulinex-algerie/\${categorySlug}\``,
  `"item": \`https://www.zorando.com/brands/\${brand.slug}/\${categorySlug}\``
);

// Fix the JSON-LD brand
content = content.replace(
  `"brand": { "@type": "Brand", "name": "\${brand.name}" }`,
  `"brand": { "@type": "Brand", "name": brand.name }`
);

// Replace "else if (isCategoryPage)" block since it's now redundant, or we can just leave it as unreachable since currentCategory is true
content = content.replace(
  `} else if (isCategoryPage) {`,
  `} else if (false) {` // quick hack to ignore it
);

fs.writeFileSync('src/pages/BrandProducts.tsx', content);
