import { sql } from '../src/db/setup.js';

const reviews = [
  { customer_name: 'Yacine M.', rating: 5, comment: 'Produit top, rien à dire. La qualité est au rendez-vous.', created_at: '2026-06-05T10:00:00Z' },
  { customer_name: 'Amina', rating: 5, comment: 'Pochette mliha bezzaf, seyitha f bhar w téléphone ta3i b9a nachef. Parfaite !', created_at: '2026-06-08T14:30:00Z' },
  { customer_name: 'Karim', rating: 4, comment: 'Bien, mais un peu difficile de faire glisser mon grand téléphone à l\'intérieur. Sinon très étanche.', created_at: '2026-05-20T09:15:00Z' },
  { customer_name: 'Sofiane', rating: 5, comment: 'Mliha bzf, tested f la piscine, ma yedkholch lma ga3.', created_at: '2026-05-15T16:45:00Z' },
  { customer_name: 'Sarah', rating: 5, comment: 'C\'est vraiment pratique pour les vacances, je recommande fortement. Livraison très rapide en plus.', created_at: '2026-06-02T11:20:00Z' },
  { customer_name: 'Walid B.', rating: 4, comment: 'Chaba bazaf w tban solide, thafedh 3la téléphone mlih.', created_at: '2026-05-10T13:10:00Z' },
  { customer_name: 'Amine', rating: 5, comment: 'Un indispensable pour la plage, rapport qualité prix imbattable, merci Zorando.', created_at: '2026-06-01T15:00:00Z' },
  { customer_name: 'Lilia', rating: 5, comment: 'Magnifique pochette, le tactile marche très bien même sous l\'eau. J\'ai pu prendre de belles vidéos.', created_at: '2026-06-10T08:30:00Z' },
  { customer_name: 'Mehdi', rating: 5, comment: 'Top ! Qualité prix heyla, w la livraison dja f wa9t.', created_at: '2026-04-25T17:20:00Z' },
  { customer_name: 'Nassim', rating: 4, comment: 'Bon produit, fait très bien l\'affaire. Elle protège de l\'eau et du sable parfaitement.', created_at: '2026-05-05T12:05:00Z' },
  { customer_name: 'Rokia', rating: 5, comment: 'Chritha w testitha 9bel fl dar w rahy mliha 100%, lma mayedkholch.', created_at: '2026-04-12T19:40:00Z' },
  { customer_name: 'Djamel', rating: 5, comment: 'Idéale pour les sorties ou la piscine. Je l\'ai essayée cet été et aucun soucis pour mon smartphone.', created_at: '2026-06-11T10:15:00Z' },
  { customer_name: 'Youcef', rating: 5, comment: 'Mziya ditha m3aya l plage, téléphone dima à l\'abri du sable w lma.', created_at: '2026-06-07T14:55:00Z' },
  { customer_name: 'Meriem', rating: 4, comment: 'Très bonne étanchéité. Le système de fermeture ferme fort, c\'est rassurant.', created_at: '2026-03-30T16:10:00Z' },
];

async function addReviews() {
  const slug = 'pochette-de-smartphone-etanche-standard';
  const [product] = await sql`SELECT id FROM products WHERE slug = ${slug}`;
  if (!product) {
    console.log('Product not found!');
    process.exit(1);
  }

  for (const review of reviews) {
    await sql`
      INSERT INTO reviews (product_id, customer_name, rating, comment, created_at, status)
      VALUES (${product.id}, ${review.customer_name}, ${review.rating}, ${review.comment}, ${review.created_at}, 'approved')
    `;
    console.log(`Added review by ${review.customer_name}`);
  }

  console.log('Finished updating reviews!');
  process.exit(0);
}

addReviews().catch(console.error);
