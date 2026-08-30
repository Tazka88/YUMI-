import { sql } from './src/db/setup.js';
async function run() {
  const [product] = await sql`SELECT seo_title FROM products WHERE slug = 'support-de-t-l-phone-voiture-magn-tique-ca81-pour-grille-d-a-ration-fixation-puissante-et-rotation-360'`;
  console.log(product);
  process.exit(0);
}
run();
