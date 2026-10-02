const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const oldRoute = `router.get('/brands/:slug/categories', async (req, res) => {
  const cacheKey = \`brand_cats_\${req.params.slug}\`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const categories = await sql\`
      SELECT c.id, c.name, c.slug 
      FROM categories c 
      JOIN products p ON p.category_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      UNION
      SELECT c.id, c.name, c.slug 
      FROM subcategories c 
      JOIN products p ON p.subcategory_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      UNION
      SELECT c.id, c.name, c.slug 
      FROM sub_subcategories c 
      JOIN products p ON p.sub_subcategory_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      ORDER BY name ASC
    \`;
    
    setCache(cacheKey, categories, 60); // 60 seconds cache
    res.json(categories);
  } catch (error) {
    console.error("Error fetching brand categories:", error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});`;

const newRoute = `router.get('/brands/:slug/categories', async (req, res) => {
  const cacheKey = \`brand_cats_\${req.params.slug}\`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const categories = await sql\`
      SELECT c.id, c.name, c.slug, 'category' as level 
      FROM categories c 
      JOIN products p ON p.category_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      UNION
      SELECT c.id, c.name, c.slug, 'subcategory' as level 
      FROM subcategories c 
      JOIN products p ON p.subcategory_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      UNION
      SELECT c.id, c.name, c.slug, 'sub_subcategory' as level 
      FROM sub_subcategories c 
      JOIN products p ON p.sub_subcategory_id = c.id 
      JOIN brands b ON p.brand_id = b.id 
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      ORDER BY name ASC
    \`;
    
    setCache(cacheKey, categories, 60); // 60 seconds cache
    res.json(categories);
  } catch (error) {
    console.error("Error fetching brand categories:", error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});`;

code = code.replace(oldRoute, newRoute);
fs.writeFileSync('src/api/routes.ts', code);
console.log('Patched routes for brand categories to include level');
