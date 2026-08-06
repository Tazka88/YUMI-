import postgres from 'postgres';
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Lifebook88855@db.evvbhalgyffagsesmvhu.supabase.co:5432/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function run() {
  try {
    // Get multismart brand
    const brands = await sql`SELECT id FROM brands WHERE lower(name) = 'multismart'`;
    if (brands.length === 0) {
      console.log('Brand multismart not found');
      process.exit(1);
    }
    const brandId = brands[0].id;

    // Get products for this brand
    const products = await sql`SELECT id FROM products WHERE brand_id = ${brandId}`;
    if (products.length === 0) {
      console.log('No products found for brand multismart');
      process.exit(1);
    }

    console.log(`Found ${products.length} products for multismart`);

    // French and Algerian Darija comments (positive, not too long)
    const comments = [
      "Très bon produit, je recommande vivement.",
      "Qualité top, rien à dire.",
      "Hayel bezzaf, yaatikom saha.",
      "Produit excellent, livraison rapide.",
      "Tbarkellah, produit mlih bezzaf.",
      "Chaba bzf, merci.",
      "Vraiment satisfait de mon achat.",
      "Top! Kima f les photos.",
      "Rien à signaler, bon rapport qualité prix.",
      "Mlih bezzaf, nansah bih.",
      "C'est la deuxième fois que j'achète, toujours top.",
      "Magnifique, j'adore.",
      "Yhabel, qualité formidable.",
      "Très pratique et de bonne qualité.",
      "Je suis très content, merci.",
      "Forza, macha'Allah.",
      "Un produit indispensable, merci l'équipe.",
      "Parfait, conforme à la description.",
      "Khir men li kount nestena.",
      "Bravo pour la qualité.",
      "Wa3er, tayara!",
      "Super produit, je ne regrette pas.",
      "Bien emballé et arrivé intact.",
      "Tjrs au top avec multismart.",
      "J'ai beaucoup aimé, merci.",
      "Grave bien!",
      "Meilleur choix.",
      "Produit d'excellente facture.",
      "Mlih et pratique.",
      "Je recommande à 100%.",
      "Kima kanet f rassi.",
      "Excellent rapport qualité-prix.",
      "Achetez les yeux fermés.",
      "Trop bien",
      "Yaatikom saha, mlih",
      "Bonne qualité",
      "Excellent",
      "C'est super",
      "Très bien",
      "Parfait",
      "Mlih",
      "Hayel",
      "Magnifique",
      "Super",
      "Top",
      "Bien",
      "Rien à dire"
    ];

    const names = [
      "Amine", "Karim", "Sarah", "Yacine", "Meriem", "Riad", "Nassim", 
      "Souhila", "Tarek", "Imane", "Mohamed", "Ahmed", "Fatima", "Amina", 
      "Kader", "Walid", "Lydia", "Mehdi", "Hocine", "Chaima", "Lyes", "Ryad",
      "Sofia", "Farouk", "Salim", "Kenza", "Celia", "Manel", "Amira"
    ];

    const now = new Date();
    let count = 0;
    
    // We want to distribute 200 reviews randomly among the products
    for (let i = 0; i < 200; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const name = names[Math.floor(Math.random() * names.length)] + " " + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + ".";
      const rating = Math.random() > 0.5 ? 5 : 4; // 4 or 5 stars
      
      // Random date within the last 6 months
      const randomDaysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
      
      await sql`
        INSERT INTO reviews (product_id, customer_name, rating, comment, status, created_at)
        VALUES (${product.id}, ${name}, ${rating}, ${comment}, 'approved', ${createdAt})
      `;
      count++;
    }

    console.log(`Successfully added ${count} reviews!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
