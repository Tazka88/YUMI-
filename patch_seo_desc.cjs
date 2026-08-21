const fs = require('fs');

const helper = `const cleanForSEO = (text, truncateLength) => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]+>/g, ' ')
                    .replace(/(?:\\*\\*|\\*|__|_|#|>|\`|~)/g, '')
                    .replace(/\\s+/g, ' ')
                    .trim();
  if (truncateLength && cleaned.length > truncateLength) {
    const truncated = cleaned.substring(0, truncateLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  return cleaned;
};
`;

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  if (!code.includes('cleanForSEO')) {
    code = code.replace(/app\.get\('\*'/g, helper + "\n  app.get('*'");
  }

  code = code.replace(
    /const \[brand\] = await sql\`SELECT id, name, description FROM brands WHERE slug = \$\{slug\}\`;/g,
    "const [brand] = await sql`SELECT id, name, description, seo_title, seo_description FROM brands WHERE slug = ${slug}`;"
  );

  code = code.replace(
    /const \[product\] = await sql\`SELECT id, name, description, price, promo_price, image FROM products WHERE slug = \$\{slug\}\`;/g,
    "const [product] = await sql`SELECT id, name, description, seo_title, seo_description, seo_keywords, price, promo_price, image FROM products WHERE slug = ${slug}`;"
  );
  
  code = code.replace(
    /description = brand\.description \|\| \`Découvrez tous les produits de la marque \$\{brand\.name\} sur ZORANDO\.\`;/g,
    "description = brand.seo_description ? cleanForSEO(brand.seo_description) : (brand.description ? cleanForSEO(brand.description, 160) : `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`);"
  );
  code = code.replace(
    /description = brand\.seo_description \|\| brand\.description \|\| \`Découvrez tous les produits de la marque \$\{brand\.name\} sur ZORANDO\.\`;/g,
    "description = brand.seo_description ? cleanForSEO(brand.seo_description) : (brand.description ? cleanForSEO(brand.description, 160) : `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`);"
  );

  code = code.replace(
    /description = product\.description \? product\.description\.substring\(0, 160\)\.replace\(\/<\[\^>\]\+>\/g, ''\) : \`Achetez \$\{product\.name\} au meilleur prix sur ZORANDO\.\`;/g,
    "description = product.seo_description ? cleanForSEO(product.seo_description) : (product.description ? cleanForSEO(product.description, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);"
  );
  code = code.replace(
    /description = product\.seo_description \|\| \(product\.description \? product\.description\.substring\(0, 160\)\.replace\(\/<\[\^>\]\+>\/g, ''\) : \`Achetez \$\{product\.name\} au meilleur prix sur ZORANDO\.\`\);/g,
    "description = product.seo_description ? cleanForSEO(product.seo_description) : (product.description ? cleanForSEO(product.description, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);"
  );

  code = code.replace(
    /title = \`\$\{product\.name\} - ZORANDO\`;/g,
    "title = product.seo_title || `${product.name} - ZORANDO`;"
  );
  
  code = code.replace(
    /description = config\.seo_description \|\| landingPage\.seo_description \|\| landingPage\.product_description\?\.substring\(0, 160\)\.replace\(\/<\[\^>\]\+>\/g, ''\) \|\| \`Découvrez \$\{landingPage\.product_name\} sur Zorando\.\`;/g,
    "description = config.seo_description ? cleanForSEO(config.seo_description) : (landingPage.seo_description ? cleanForSEO(landingPage.seo_description) : (landingPage.product_description ? cleanForSEO(landingPage.product_description, 160) : `Découvrez ${landingPage.product_name} sur Zorando.`));"
  );

  code = code.replace(
    /description = post\.seo_description \|\| post\.excerpt \|\| \`Lisez notre article : \$\{post\.title\}\`;/g,
    "description = post.seo_description ? cleanForSEO(post.seo_description) : (post.excerpt ? cleanForSEO(post.excerpt, 160) : `Lisez notre article : ${post.title}`);"
  );

  fs.writeFileSync(filepath, code);
  console.log("Patched", filepath);
}

patchFile('server.ts');
patchFile('api/index.ts');
