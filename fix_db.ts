import { sql } from './src/db/setup.js';

async function run() {
  await sql.begin(async (sql) => {
    // ---- HOCO W45 ----
    // Keep 15, Deactivate 19
    await sql`UPDATE products SET is_active = false WHERE id = 19`;
    // Move reviews from 19 to 15
    await sql`UPDATE reviews SET product_id = 15 WHERE product_id = 19`;
    // Move order_items from 19 to 15
    await sql`UPDATE order_items SET product_id = 15 WHERE product_id = 19`;
    // Set canonical slug for 15
    await sql`UPDATE products SET slug = 'hoco-casque-sans-fil-bluetooth-5-3-400mah-w45' WHERE id = 15`;

    // ---- MI BAND 10 ----
    // Keep 316, Deactivate 179
    await sql`UPDATE products SET is_active = false WHERE id = 179`;
    // Move reviews
    await sql`UPDATE reviews SET product_id = 316 WHERE product_id = 179`;
    // Move order_items
    await sql`UPDATE order_items SET product_id = 316 WHERE product_id = 179`;
    // Update slug for 316
    await sql`UPDATE products SET slug = 'mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque' WHERE id = 316`;
    
    // Set up redirect table or maybe just redirect logic? Wait, there is no redirect table yet.
    // Let's create a redirects table if it doesn't exist to store 301s.
    await sql`
      CREATE TABLE IF NOT EXISTS redirects (
        id SERIAL PRIMARY KEY,
        old_path TEXT NOT NULL UNIQUE,
        new_path TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add redirects
    await sql`INSERT INTO redirects (old_path, new_path) VALUES ('/product/hoco-casque-sans-w45', '/product/hoco-casque-sans-fil-bluetooth-5-3-400mah-w45') ON CONFLICT (old_path) DO NOTHING`;
    await sql`INSERT INTO redirects (old_path, new_path) VALUES ('/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-cran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque', '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque') ON CONFLICT (old_path) DO NOTHING`;
    await sql`INSERT INTO redirects (old_path, new_path) VALUES ('/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-172-pouces-bt54-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque', '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque') ON CONFLICT (old_path) DO NOTHING`;
  });
  console.log("DB fixes applied.");
  process.exit(0);
}
run();
