import { buildProductSchema, buildBreadcrumbSchema } from './src/lib/schemaUtils';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./db_out2.json', 'utf-8'));

const productSchema = buildProductSchema(
  data.product, 
  data.reviews, 
  'https://www.zorando.com/product/green-lion-ultra-slim-mag-batterie-externe-magnetique-sans-fil-4000-mah', 
  'https://www.zorando.com'
);

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Accueil', item: 'https://www.zorando.com/' },
  { name: data.product.name, item: 'https://www.zorando.com/product/green-lion-ultra-slim-mag-batterie-externe-magnetique-sans-fil-4000-mah' }
]);

const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
console.log(JSON.stringify(graphSchema, null, 2));
