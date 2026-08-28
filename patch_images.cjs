const fs = require('fs');

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf-8');
  const searchStr = 'const allReviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;';
  const replaceStr = `const allReviews = await sql\`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = \${product.id} ORDER BY created_at DESC\`;
          
          const extraImages = await sql\`SELECT image FROM product_images WHERE product_id = \${product.id} ORDER BY id ASC\`;
          product.images = extraImages.map((img: any) => img.image);`;
          
  if (code.includes(searchStr)) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync(file, code);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find target string in ${file}`);
  }
}
