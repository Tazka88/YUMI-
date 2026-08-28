const fs = require('fs');

let code = fs.readFileSync('src/lib/schemaUtils.ts', 'utf-8');

const searchStr = `  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": imageUrl,
    "description": product.description ? product.description.substring(0, 5000).replace(/<[^>]+>/g, '') : '',
  };`;

const replaceStr = `  const images: string[] = [];
  if (imageUrl) images.push(imageUrl);
  
  if (product.images && Array.isArray(product.images)) {
    for (let img of product.images) {
      if (img && img.startsWith('/')) {
        images.push(\`\${baseUrl}\${img}\`);
      } else if (img) {
        images.push(img);
      }
    }
  }

  // Deduplicate array
  const uniqueImages = [...new Set(images)];

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": uniqueImages.length > 0 ? uniqueImages : undefined,
    "description": product.description ? product.description.substring(0, 5000).replace(/<[^>]+>/g, '') : '',
  };`;

if (code.includes(searchStr)) {
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync('src/lib/schemaUtils.ts', code);
  console.log("Updated schemaUtils.ts");
} else {
  console.log("Could not find searchStr");
}
