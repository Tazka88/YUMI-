const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// We are going to change the SQL query for brand categories to ONLY return 'sub_subcategory'
const oldQuery = `
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
`;

const newQuery = `
    // Modification: on ne récupère QUE les sous-sous-catégories pour éviter les doublons de pages
    const categories = await sql\`
      SELECT c.id, c.name, c.slug, 'sub_subcategory' as level 
       FROM sub_subcategories c 
       JOIN products p ON p.sub_subcategory_id = c.id 
       JOIN brands b ON p.brand_id = b.id 
       WHERE b.slug = \${req.params.slug} AND p.is_active = true
       GROUP BY c.id, c.name, c.slug
       ORDER BY c.name ASC
    \`;
`;

// However, if some products are NOT in a sub_subcategory, they might not show any category filters. 
// A safer approach is to get the deepest category assigned to each product.
// But the user specifically requested "que les sous sous categorie". Let's stick strictly to what he asked first. 

code = code.replace(oldQuery.trim(), newQuery.trim());
fs.writeFileSync('src/api/routes.ts', code);
console.log('Query updated');
