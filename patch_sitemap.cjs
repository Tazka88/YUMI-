const fs = require('fs');
const file = 'src/api/routes.ts';
let code = fs.readFileSync(file, 'utf8');

const targetQuery = `    const [products, categories, brands, pages] = await Promise.all([
      sql\`SELECT slug, created_at FROM products\`,
      sql\`SELECT slug FROM categories\`,
      sql\`SELECT slug FROM brands\`,
      sql\`SELECT slug, updated_at FROM pages\`
    ]);`;

const replacementQuery = `    const [products, categories, subcategories, sub_subcategories, brands, pages] = await Promise.all([
      sql\`SELECT slug, created_at FROM products\`,
      sql\`SELECT slug FROM categories\`,
      sql\`SELECT slug FROM subcategories\`,
      sql\`SELECT slug FROM sub_subcategories\`,
      sql\`SELECT slug FROM brands\`,
      sql\`SELECT slug, updated_at FROM pages\`
    ]);`;

const targetLoop = `    categories.forEach(c => {
      xml += \`
  <url>
    <loc>\${baseUrl}/category/\${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\`;
    });`;

const replacementLoop = `    categories.forEach(c => {
      xml += \`
  <url>
    <loc>\${baseUrl}/category/\${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\`;
    });
    
    subcategories.forEach(c => {
      xml += \`
  <url>
    <loc>\${baseUrl}/category/\${c.slug}?sub=true</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\`;
    });
    
    sub_subcategories.forEach(c => {
      xml += \`
  <url>
    <loc>\${baseUrl}/category/\${c.slug}?subsub=true</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>\`;
    });`;

if(code.includes(targetQuery) && code.includes(targetLoop)) {
    code = code.replace(targetQuery, replacementQuery);
    code = code.replace(targetLoop, replacementLoop);
    fs.writeFileSync(file, code);
    console.log("Sitemap patched successfully.");
} else {
    console.log("Could not find targets in src/api/routes.ts");
}
