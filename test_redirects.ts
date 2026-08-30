import { sql } from './src/db/setup.js';

async function test() {
  const slugs = [
    'hoco-casque-sans-w45',
    'hoco-casque-sans-fil-bluetooth-5-3-400mah-w45',
    'mi-band-10-bracelet-inteligent-150-modes-sportifs-cran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    'mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque'
  ];
  for (const slug of slugs) {
    const p = await sql`SELECT id, slug, is_active FROM products WHERE slug = ${slug}`;
    console.log(slug, ':', p);
  }
  process.exit(0);
}
test();
