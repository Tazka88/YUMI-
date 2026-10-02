const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// The previous fix only grabbed sub_subcategories. 
// If a brand has products that are ONLY assigned to a category or a subcategory, 
// they wouldn't show any category filters at all!
// The correct logic is: for each product of this brand, find the DEEPEST category it belongs to, 
// and aggregate those. 
// Since SQL makes finding the "deepest" a bit tricky across 3 levels dynamically, 
// we can do a UNION of all categories, subcategories, and sub_subcategories 
// that are DIRECTLY tied to a product for that brand.
// Wait, the original code did exactly that (UNION of all 3).
// BUT the original code returned 'category' for category_id, 'subcategory' for subcategory_id, etc.
// The issue was that a single product might have ALL THREE fields filled 
// (category_id, subcategory_id, sub_subcategory_id), 
// which caused the original query to output 3 different rows for the SAME product.

const oldQueryBlock = `
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

const newQueryBlock = `
    // Récupérer la catégorie la plus profonde (précise) renseignée pour chaque produit de la marque
    const categories = await sql\`
      SELECT DISTINCT 
        COALESCE(ss.id, s.id, c.id) as id,
        COALESCE(ss.name, s.name, c.name) as name,
        COALESCE(ss.slug, s.slug, c.slug) as slug,
        CASE 
          WHEN ss.id IS NOT NULL THEN 'sub_subcategory'
          WHEN s.id IS NOT NULL THEN 'subcategory'
          ELSE 'category'
        END as level
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN sub_subcategories ss ON p.sub_subcategory_id = ss.id
      WHERE b.slug = \${req.params.slug} AND p.is_active = true
      ORDER BY name ASC
    \`;
`;

code = code.replace(oldQueryBlock.trim(), newQueryBlock.trim());
fs.writeFileSync('src/api/routes.ts', code);
console.log('Query fixed for all brands');
