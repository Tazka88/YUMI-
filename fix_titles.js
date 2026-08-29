import { sql } from './src/db/setup.js';

const slugs = [
  'hoco-j100a-high-ranking-power-bank-20000mah-haute-capacite-charge-rapide',
  'ecouteurs-sans-fil-ew78-hoco-avec-une-autonomie-de-4-heures',
  'power-bank-charge-rapide-30000-mah-22-5w-hoco-j101b',
  'tondeuse-professionnelle-kemei-km-1858-brushless-9000-rpm-batterie-4600-mah-usb-c',
  'tondeuse-kemei-km-1845-sans-fil-etanche-ipx7-lame-ceramique-recharge-usb',
  'tondeuse-professionnelle-kemei-km-1743-sans-fil-7000-rpm-usb-c-ecran-led',
  'tondeuse-professionnelle-sans-fil-pour-hommes-avec-lame-en-t-et-cran-led-kemei-km-2293',
  'blender-multifonction-robuste-bh550-550w-bol-15l-incassable',
  'chaise-longue-confortable-soft-top-portable-165-x-84-x-79-cm-bestway',
  'fer-a-boucler-triple-barillet-enzoen1968',
  'pataugeoire-piscine-plastique-3-anneaux-pour-enfants-51128',
  'tondeuse-professionnelle-sokany-sk-16070-sans-fil-rechargeable-ecran-led-usb-c',
  'appareil-photo-pour-enfants-dessin-anime-photograpie-en-plein-air-bleu',
  'plokama-anneau-lumineux-led-rgb-au-design-compact-avec-miroirs-convexes-rotation-180-et-trois-couleurs-r-glables-jusqu-10-niveaux-mod-le-u20-pro',
  'philips-oneblade-qp2510-10-tondeuse-rechargeable-original-algerie',
  'presentoir-de-cintres-48-kg-en-metal-avec-3-etageres-110x40x150-cm-noir',
  'revlon-brosse-noir-rvdr5222e4-en-algerie',
  'piscine-gonflable-enfant-bestway-157x46cm-4-anneaux-51117'
];

async function updateTitles() {
  console.log('Updating SEO titles...');
  for (const slug of slugs) {
    const [product] = await sql`SELECT id, name, seo_title FROM products WHERE slug = ${slug}`;
    if (product) {
      let newTitle = product.seo_title;
      // If seo_title is null, empty, or we just want to force update it to a clean name
      if (!newTitle || newTitle.trim() === '') {
        newTitle = product.name.substring(0, 55).trim();
        console.log(`Updating ${slug} to "${newTitle}"`);
        await sql`UPDATE products SET seo_title = ${newTitle} WHERE id = ${product.id}`;
      } else {
        console.log(`Skipping ${slug}, already has title: "${newTitle}"`);
      }
    }
  }
  console.log('Done.');
  process.exit(0);
}

updateTitles();
