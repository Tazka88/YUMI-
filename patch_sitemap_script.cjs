const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `      const products = await sql\`SELECT slug, created_at, is_active FROM products WHERE is_active = true\`;
      const categories = await sql\`SELECT slug FROM categories\`;
      const brands = await sql\`SELECT slug FROM brands\`;
      const posts = await sql\`SELECT slug, created_at FROM blog_posts WHERE status = 'published'\`;`;

const replacement1 = `      const products = await sql\`SELECT slug, created_at, is_active FROM products WHERE is_active = true\`;
      const categories = await sql\`SELECT slug FROM categories\`;
      const subcategories = await sql\`SELECT slug FROM subcategories\`;
      const sub_subcategories = await sql\`SELECT slug FROM sub_subcategories\`;
      const brands = await sql\`SELECT slug FROM brands\`;
      const posts = await sql\`SELECT slug, created_at FROM blog_posts WHERE status = 'published'\`;`;

const target2 = `      // Categories
      categories.forEach(cat => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/category/\${cat.slug}</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      });`;

const replacement2 = `      // Categories
      categories.forEach(cat => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/category/\${cat.slug}</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      });

      // Subcategories
      subcategories.forEach(sub => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/category/\${sub.slug}?sub=true</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.7</priority>\\n  </url>\\n\`;
      });

      // Sub-subcategories
      sub_subcategories.forEach(subsub => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/category/\${subsub.slug}?subsub=true</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.6</priority>\\n  </url>\\n\`;
      });`;

if (code.includes(target1) && code.includes(target2)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    fs.writeFileSync('server.ts', code);
    console.log('Patched successfully.');
} else {
    console.log('Failed to find targets.');
}
