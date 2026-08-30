import { sql } from './src/db/setup.js';

const slugs = [
  'support-de-t-l-phone-voiture-magn-tique-ca81-pour-grille-d-a-ration-fixation-puissante-et-rotation-360',
  'support-magn-tique-hoco-k25-pour-diffusion-en-direct-support-smartphone-rotatif-pour-live-streaming-et-vlogs',
  'kemei-km-580a-tondeuse-multifonction-7-en-1-rechargeable-sans-fil-pour-homme',
  'tondeuse-de-precision-kemei-km-3023-702-professionnelle-9000-rpm-base-de-charge-usb-c',
  'piscine-gonflable-enfant-ronde-70-x-24-cm-bestway-51128',
  'cafetiere-electrique-780w-5-tasses-cen05-robuste-et-compacte-pour-cafe-maison',
  'etagere-d-angle-murale-double-en-aluminium-rangement-pratique-salle-de-bain-et-cuisine',
  'mini-imprimante-thermique-bluetooth-sans-fil-pour-smartphone',
  'enzo-professional-brosse-volumisante-en-6215-professionnelle-1500watt-noir-en-algerie',
  'porte-chaussures-6-etages-facile-a-deplacer',
  '100-sacs-de-conservation-des-aliments-elastiques-reutilisables',
  'sac-de-poitrine-pour-hommes-tactique-pour-workouts-course-pied-v-lo-noir-en-algerie',
  'anneau-lumineux-led-rgb-de-10-13-et-18-pouces',
  'bouee-aquatique-pour-bebe-81cm-x-79-cm-intex',
  'chargeur-telephone-powerport-pd-30w-usb-c-cube-charge-ultra-rapide-compatible-pour-iphones-huawei'
];

async function updateTitles() {
  let updatedCount = 0;
  for (const slug of slugs) {
    const [product] = await sql`SELECT id, name, seo_title FROM products WHERE slug = ${slug}`;
    if (product) {
      if (!product.seo_title || product.seo_title.trim() === '') {
        let newTitle = product.name.substring(0, 50).trim();
        newTitle = `${newTitle} | ZORANDO`;
        console.log(`Updating ${slug} -> "${newTitle}"`);
        await sql`UPDATE products SET seo_title = ${newTitle} WHERE id = ${product.id}`;
        updatedCount++;
      } else {
        console.log(`Skipped (already has title): ${slug}`);
      }
    } else {
      console.log(`Not found: ${slug}`);
    }
  }
  console.log(`Successfully updated ${updatedCount} products.`);
  process.exit(0);
}

updateTitles();
