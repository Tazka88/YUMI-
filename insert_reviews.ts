import { sql, setupDb } from './src/db/setup.js';

const names = [
  "Amine", "Yacine", "Sarah", "Meriem", "Karim", "Samir", "Naila", "Hichem", 
  "Idir", "Walid", "Rym", "Anis", "Mohamed", "Nassim", "Youcef", "Sofiane", 
  "Fatiha", "Zaki", "Ilyes", "Amina", "Bilal", "Djamel", "Fares", "Houssam", 
  "Islem", "Lyes", "Malek", "Nabil", "Omar", "Rafik", "Rayan", "Reda", "Salim", 
  "Tarek", "Youssef", "Asma", "Chahinez", "Dalia", "Farah", "Hadjer", "Imen", 
  "Kenza", "Lamia", "Manel", "Nada", "Nesrine", "Rania", "Safia", "Selma", 
  "Yasmine", "Zineb", "Ali", "Hakim", "Brahim", "Khaled", "Fouad", "Mounir",
  "Nawel", "Sonia", "Samia", "Fatima", "Kader", "Tahar", "Hassan", "Mourad"
];

const comments = [
  "فور بزاف يعطيك الصحة",
  "هايل مبرد مليح فالصيف",
  "لحقني اليوم شكرا",
  "qualité mliha w yched la charge",
  "top top, chritou l yemma w 3jebha",
  "khfif w maydirch l7ess",
  "pratique lbarra f s5ana",
  "ghaya, kima f tsawer",
  "ch7al w ana n7awes 3lih, merci",
  "mli7 llkhadma",
  "livraison rapide, ya3tikom sa7a",
  "raw3a w souma m3goula",
  "wlh ma ndemt li chritou",
  "super! nanssa7 bih",
  "hayel l s5ana ta3 lbus",
  "mlih fi dar wela f tomobil",
  "4/5",
  "5/5 macha allah",
  "chbab w yberred",
  "produit tayara",
  "yched la charge mlih",
  "c bon wselni",
  "top mrc",
  "merci zorando",
  "Très pratique pour l'été.",
  "J'adore, super léger !",
  "Bonne qualité, je recommande.",
  "Vraiment silencieux, parfait pour le bureau.",
  "Livraison très rapide, merci.",
  "Bon produit, correspond à la description.",
  "Très bien, la batterie tient longtemps.",
  "Pratique dans les transports.",
  "Idéal pour les chaleurs.",
  "Je l'ai acheté pour le sport, c'est top.",
  "Super design, j'ai pris la couleur noire.",
  "Fonctionne très bien.",
  "Assez léger autour du cou.",
  "Le flux d'air est bon.",
  "5 étoiles !",
  "Merci pour la rapidité.",
  "Satisfait de mon achat.",
  "Produit original.",
  "Bien emballé.",
  "C'est mon deuxième achat.",
  "Rien à dire, parfait.",
  "Excellent rapport qualité prix.",
  "يعطيكم الصحة",
  "macha allah",
  "très bon produit",
  "je valide",
  "c'est super pratique",
  "bravo",
  "mrc",
  "top",
  "impeccable",
  "parfait pour la cuisine aussi",
  "la livraison kanet f wa9t",
  "bien",
  "recommandé",
  "mli7",
  "hayel",
  "fort",
  "super produit",
  "10/10",
  "vraiment top"
];

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function insertReviews() {
  await setupDb();
  
  const productId = 559; // from curl check
  
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 45); // distribute over last 45 days
  
  const values = [];
  
  for (let i = 0; i < 65; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const comment = comments[Math.floor(Math.random() * comments.length)];
    const rating = Math.random() > 0.15 ? 5 : 4; // mostly 5s, some 4s
    const date = getRandomDate(past, now);
    
    values.push({
      product_id: productId,
      customer_name: name,
      rating: rating,
      comment: comment,
      status: 'approved',
      created_at: date.toISOString()
    });
  }
  
  // Sort by date ascending to insert in chronological order (optional, but good for id sequence if needed)
  values.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  console.log(`Inserting ${values.length} reviews...`);
  
  for (const v of values) {
    await sql`
      INSERT INTO public.reviews (product_id, customer_name, rating, comment, status, created_at)
      VALUES (${v.product_id}, ${v.customer_name}, ${v.rating}, ${v.comment}, ${v.status}, ${v.created_at})
    `;
  }
  
  console.log('Done!');
  process.exit(0);
}

insertReviews().catch(console.error);
