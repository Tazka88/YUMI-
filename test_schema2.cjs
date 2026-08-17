const { buildProductSchema, buildBreadcrumbSchema } = require('./temp_out/schemaUtils.js');
const data = require('./db_out.json');

const productSchema = buildProductSchema(
  data.product, 
  data.reviews, 
  'https://www.zorando.com/product/air-fryer-multismart-ms-af2310-10l-double-stack-2400w-friteuse-sans-huile-2-en-1-ecran-tactile-couleur', 
  'https://www.zorando.com'
);

const breadcrumbItems = [
  { name: 'Accueil', item: 'https://www.zorando.com/' },
  { name: data.product.category_name, item: 'https://www.zorando.com/category/electromenager' },
  { name: data.product.name, item: 'https://www.zorando.com/product/air-fryer-multismart-ms-af2310-10l-double-stack-2400w-friteuse-sans-huile-2-en-1-ecran-tactile-couleur' }
];
const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };

console.log(JSON.stringify(graphSchema, null, 2));
