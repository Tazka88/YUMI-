const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf-8');
code = code.replace(
  `const schemaData = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };`,
  `delete productSchema["@context"];\n          delete breadcrumbSchema["@context"];\n          const schemaData = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };`
);
fs.writeFileSync('api/index.ts', code);
