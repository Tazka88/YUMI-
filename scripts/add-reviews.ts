import { sql } from '../src/db/setup.js';

const reviews = [
  { customer_name: 'Amine', rating: 5, comment: 'Mlah bzf, ya3tikom saha.', created_at: '2026-06-11T10:00:00Z' },
  { customer_name: 'Sophie', rating: 5, comment: 'Très pratiques pour organiser les placards, qualité top.', created_at: '2026-06-10T14:30:00Z' },
  { customer_name: 'Karim', rating: 4, comment: 'Chabine yajm3ou el khorda ta3 ddar.', created_at: '2026-06-09T09:15:00Z' },
  { customer_name: 'Dounia', rating: 4, comment: 'Bonnes boîtes, taille idéale.', created_at: '2026-06-08T16:45:00Z' },
  { customer_name: 'Célia', rating: 5, comment: 'C\'est super pour mes produits de beauté, merci.', created_at: '2026-06-07T11:20:00Z' },
  { customer_name: 'Walid', rating: 5, comment: 'Kbar w yerfdou bzaf hwayej.', created_at: '2026-06-06T13:10:00Z' },
  { customer_name: 'Nassim', rating: 4, comment: 'Arrivé en bon état, je recommande.', created_at: '2026-06-05T15:00:00Z' },
  { customer_name: 'Imane', rating: 5, comment: 'Haylin ! Ndamt bihoum l kozina.', created_at: '2026-06-04T08:30:00Z' },
  { customer_name: 'Nabil', rating: 4, comment: 'Prix raisonnable et plastique solide.', created_at: '2026-06-03T17:20:00Z' },
  { customer_name: 'Manel', rating: 5, comment: 'Pratique et esthétique pour la maison.', created_at: '2026-06-02T12:05:00Z' },
  { customer_name: 'Tarik', rating: 4, comment: 'Mlah, chrit 2 packs tsema 6 snade9.', created_at: '2026-06-01T19:40:00Z' },
  { customer_name: 'Lyes', rating: 5, comment: 'Idéal pour le bureau, ça range très bien les affaires.', created_at: '2026-05-31T10:15:00Z' },
  { customer_name: 'Rayan', rating: 5, comment: 'Top qualité rien à redire.', created_at: '2026-05-30T14:55:00Z' },
  { customer_name: 'Fatima', rating: 5, comment: 'Yna9ssou al fawda fdarr, chokran.', created_at: '2026-05-29T16:10:00Z' },
  { customer_name: 'Samir', rating: 4, comment: 'Bon rapport qualité/prix.', created_at: '2026-05-28T09:30:00Z' },
  { customer_name: 'Houda', rating: 5, comment: 'Sbah lkheir, chrithoum l bit drari w nf3ouni.', created_at: '2026-05-27T11:45:00Z' },
  { customer_name: 'Anis', rating: 5, comment: 'Très content de mon achat, conforme aux photos.', created_at: '2026-05-26T15:20:00Z' },
  { customer_name: 'Meriem', rating: 5, comment: 'Excellent, 3awnoni bzaf f tndhim.', created_at: '2026-05-25T18:10:00Z' },
  { customer_name: 'Sara', rating: 5, comment: 'Je les utilise dans la salle de bain, parfait.', created_at: '2026-05-24T13:40:00Z' },
  { customer_name: 'Mourad', rating: 4, comment: 'Plastique ta3houm mlih w s7i7.', created_at: '2026-05-23T10:05:00Z' },
  { customer_name: 'Yacine', rating: 4, comment: 'Livraison rapide et produit nickel.', created_at: '2026-05-22T16:50:00Z' },
  { customer_name: 'Kahina', rating: 5, comment: 'Chaba bazaf, kima f tsawer.', created_at: '2026-05-21T09:25:00Z' },
  { customer_name: 'Rania', rating: 5, comment: 'Vraiment très utiles à la maison comme au travail.', created_at: '2026-05-20T14:15:00Z' },
  { customer_name: 'Hichem', rating: 5, comment: 'Ya3tikom saha, waslsni f we9tou.', created_at: '2026-05-19T11:00:00Z' },
  { customer_name: 'Zineb', rating: 5, comment: 'Je vais en recommander, c\'est assez robuste.', created_at: '2026-05-18T17:35:00Z' },
  { customer_name: 'Amine R.', rating: 4, comment: 'Fort, très pratique l rangement w tji mt9ouba m trig.', created_at: '2026-05-17T12:20:00Z' },
];

async function addReviews() {
  const slug = 'pack-3-boite-de-rangement-ouverte-rectangulaire-organisateur-pratique-pour-maison-et-bureau';
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
