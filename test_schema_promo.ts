import { buildProductSchema, buildBreadcrumbSchema } from './src/lib/schemaUtils';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./db_out3.json', 'utf-8'));

const productSchema = buildProductSchema(
  data.product, 
  data.reviews, 
  'https://www.zorando.com/product/kemei-km-580a-tondeuse-multifonction-7-en-1-rechargeable-sans-fil-pour-homme', 
  'https://www.zorando.com'
);

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Accueil', item: 'https://www.zorando.com/' },
  { name: data.product.name, item: 'https://www.zorando.com/product/kemei-km-580a-tondeuse-multifonction-7-en-1-rechargeable-sans-fil-pour-homme' }
]);

const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
console.log(JSON.stringify(graphSchema, null, 2));
