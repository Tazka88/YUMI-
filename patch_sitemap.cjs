const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const sitemapQuery = `const [products, categories, subcategories, sub_subcategories, brands, pages] = await Promise.all([
      sql\`SELECT slug, created_at FROM products WHERE is_active = true\`,
      sql\`SELECT slug FROM categories\`,
      sql\`SELECT slug FROM subcategories\`,
      sql\`SELECT slug FROM sub_subcategories\`,
      sql\`SELECT slug FROM brands\`,
      sql\`SELECT slug, updated_at FROM pages\`
    ]);`;

const replacementSitemapQuery = `const [products, categories, subcategories, sub_subcategories, brands, pages, brandCategories, brandSubCategories, brandSubSubCategories] = await Promise.all([
      sql\`SELECT slug, created_at FROM products WHERE is_active = true\`,
      sql\`SELECT slug FROM categories\`,
      sql\`SELECT slug FROM subcategories\`,
      sql\`SELECT slug FROM sub_subcategories\`,
      sql\`SELECT slug FROM brands\`,
      sql\`SELECT slug, updated_at FROM pages\`,
      sql\`SELECT DISTINCT b.slug as brand_slug, c.slug as category_slug FROM products p JOIN brands b ON p.brand_id = b.id JOIN categories c ON p.category_id = c.id WHERE p.is_active = true AND p.category_id IS NOT NULL\`,
      sql\`SELECT DISTINCT b.slug as brand_slug, c.slug as category_slug FROM products p JOIN brands b ON p.brand_id = b.id JOIN subcategories c ON p.subcategory_id = c.id WHERE p.is_active = true AND p.subcategory_id IS NOT NULL\`,
      sql\`SELECT DISTINCT b.slug as brand_slug, c.slug as category_slug FROM products p JOIN brands b ON p.brand_id = b.id JOIN sub_subcategories c ON p.sub_subcategory_id = c.id WHERE p.is_active = true AND p.sub_subcategory_id IS NOT NULL\`
    ]);`;

code = code.replace(sitemapQuery, replacementSitemapQuery);

const sitemapBrands = `    brands.forEach(b => {
      xml += \`
  <url>
    <loc>\${baseUrl}/brands/\${b.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\`;
    });`;

const replacementSitemapBrands = `    brands.forEach(b => {
      xml += \`
  <url>
    <loc>\${baseUrl}/brands/\${b.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\`;
    });
    
    // Dynamically add brand + category URLs
    const addedBrandCategories = new Set();
    const addBrandCat = (b, c) => {
      if (b && c) {
        const url = \`\${baseUrl}/brands/\${b}/\${c}\`;
        if (!addedBrandCategories.has(url)) {
          addedBrandCategories.add(url);
          xml += \`
  <url>
    <loc>\${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\`;
        }
      }
    };
    
    brandCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));
    brandSubCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));
    brandSubSubCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));
`;

code = code.replace(/    brands\.forEach\(b => \{[\s\S]*?<\/url>`[^}]*\}\);/, replacementSitemapBrands);

fs.writeFileSync('src/api/routes.ts', code);
console.log('Patched sitemap generation');
