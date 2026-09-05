const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const oldQueryBlock = `
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

const newQueryBlock = `
    // Modification STRICITE : ON NE PREND QUE LES SOUS-SOUS-CATÉGORIES, EXACTEMENT COMME LE CLIENT LE DEMANDE.
    const categories = await sql\`
      SELECT DISTINCT
        c.id, c.name, c.slug, 'sub_subcategory' as level 
       FROM sub_subcategories c 
       JOIN products p ON p.sub_subcategory_id = c.id 
       JOIN brands b ON p.brand_id = b.id 
       WHERE b.slug = \${req.params.slug} AND p.is_active = true
       ORDER BY c.name ASC
    \`;
`;

code = code.replace(oldQueryBlock.trim(), newQueryBlock.trim());
fs.writeFileSync('src/api/routes.ts', code);
console.log('Query fixed STRICTLY for sub_subcategories only');
