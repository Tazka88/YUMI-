const fs = require('fs');

let content = fs.readFileSync('src/pages/BrandProducts.tsx', 'utf8');

const badPart = `  return (
    <div className="container mx-auto px-4 py-8">
        let schemaData = [];`;

const fixedPart = `  let schemaData = [];`;

if (content.includes(badPart)) {
    content = content.replace(badPart, fixedPart);
    fs.writeFileSync('src/pages/BrandProducts.tsx', content);
    console.log("Fixed syntax error");
} else {
    console.log("Could not find the bad part!");
}
