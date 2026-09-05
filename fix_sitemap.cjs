const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// The sitemap Promise.all includes brandCategories, brandSubCategories, brandSubSubCategories
// We need to keep the promise signatures intact or change them.

const oldPromiseAll = `const [products, categories, subcategories, sub_subcategories, brands, pages, brandCategories, brandSubCategories, brandSubSubCategories] = await Promise.all([
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

const newPromiseAll = `const [products, categories, subcategories, sub_subcategories, brands, pages, brandSubSubCategories] = await Promise.all([
      sql\`SELECT slug, created_at FROM products WHERE is_active = true\`,
      sql\`SELECT slug FROM categories\`,
      sql\`SELECT slug FROM subcategories\`,
      sql\`SELECT slug FROM sub_subcategories\`,
      sql\`SELECT slug FROM brands\`,
      sql\`SELECT slug, updated_at FROM pages\`,
      sql\`SELECT DISTINCT b.slug as brand_slug, c.slug as category_slug FROM products p JOIN brands b ON p.brand_id = b.id JOIN sub_subcategories c ON p.sub_subcategory_id = c.id WHERE p.is_active = true AND p.sub_subcategory_id IS NOT NULL\`
    ]);`;

code = code.replace(oldPromiseAll, newPromiseAll);

const oldAddingToSitemap = `brandCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));
    brandSubCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));
    brandSubSubCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));`;

const newAddingToSitemap = `// On ne garde QUE les sous-sous-catégories pour éviter le duplicate content SEO
    brandSubSubCategories.forEach(row => addBrandCat(row.brand_slug, row.category_slug));`;

code = code.replace(oldAddingToSitemap, newAddingToSitemap);

fs.writeFileSync('src/api/routes.ts', code);
console.log('Sitemap fixed for strict sub_subcategories');
