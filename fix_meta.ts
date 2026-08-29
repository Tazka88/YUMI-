import { sql } from './src/db/setup.js';

async function run() {
  await sql.begin(async (sql) => {
    // ---- HOCO W45 (ID 15) ----
    await sql`UPDATE products SET seo_description = 'Découvrez le casque sans fil Hoco W45 Bluetooth 5.3 sur Zorando. Avec sa batterie de 400mAh, profitez d''un son exceptionnel. Commandez maintenant !' WHERE id = 15`;

    // ---- MI BAND 10 (ID 316) ----
    await sql`UPDATE products SET seo_description = 'Achetez le bracelet intelligent Mi Band 10 sur Zorando. Écran AMOLED 1.72", 150+ modes sportifs et 21 jours d''autonomie. Livraison rapide en Algérie.' WHERE id = 316`;
  });
  console.log("Meta fixes applied.");
  process.exit(0);
}
run();
