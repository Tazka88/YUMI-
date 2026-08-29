import { sql } from './src/db/setup.js';

async function test() {
  const slugs = [
    'hoco-j100a-high-ranking-power-bank-20000mah-haute-capacite-charge-rapide',
    'pataugeoire-piscine-plastique-3-anneaux-pour-enfants-51128'
  ];
  for (const slug of slugs) {
    const [product] = await sql`SELECT seo_title, name FROM products WHERE slug = ${slug}`;
    console.log(JSON.stringify(product));
  }
  process.exit(0);
}
test();
