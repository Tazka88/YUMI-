const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const regex = /const categories = await sql\`([\s\S]*?)ORDER BY name ASC\s*\`;/m;

const newQueryBlock = `const categories = await sql\`
      SELECT DISTINCT
        c.id, c.name, c.slug, 'sub_subcategory' as level 
       FROM sub_subcategories c 
       JOIN products p ON p.sub_subcategory_id = c.id 
       JOIN brands b ON p.brand_id = b.id 
       WHERE b.slug = \${req.params.slug} AND p.is_active = true
       ORDER BY c.name ASC
    \`;`;

if (!regex.test(code)) {
    console.log("REGEX NOT FOUND!");
} else {
    code = code.replace(regex, newQueryBlock);
    fs.writeFileSync('src/api/routes.ts', code);
    console.log('Query fixed with REGEX');
}
