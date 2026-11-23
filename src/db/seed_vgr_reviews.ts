import { sql } from './setup.ts';

interface SeedReview {
  productId: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const vgrReviews: SeedReview[] = [
  // 816 - VGR V-001 (2 avis : 5 & 4 -> moy 4.5)
  {
    productId: 816,
    customerName: 'مهدي - الجزائر العاصمة',
    rating: 5,
    comment: 'ماكينة قوية بزاف، البطارية 4600 تشد السمانة كاملة في الصالون والشفرة ما تسخنش.',
    createdAt: '2026-08-14T11:20:00Z'
  },
  {
    productId: 816,
    customerName: 'Karim B. - Oran',
    rating: 4,
    comment: 'Très bonne coupe sur cheveux épais, l’autonomie est énorme. Un peu lourde en main mais solide.',
    createdAt: '2026-10-19T16:45:00Z'
  },

  // 815 - VGR V-668 (2 avis : 5 & 5 -> moy 5.0)
  {
    productId: 815,
    customerName: 'Walid Coiffure - Sétif',
    rating: 5,
    comment: 'Le moteur Vector 11 000 tr/min coupe net sans jamais bloquer. Excellente pour les dégradés.',
    createdAt: '2026-09-04T14:10:00Z'
  },
  {
    productId: 815,
    customerName: 'ياسين - البليدة',
    rating: 5,
    comment: 'قوة محرك فيكتور هايلة، تقطع الشعر الخشين من الضربة اللولة والتوصيل وصل في يومين.',
    createdAt: '2026-11-12T18:05:00Z'
  },

  // 814 - VGR V-001 Blue Edition (2 avis : 4 & 5 -> moy 4.5)
  {
    productId: 814,
    customerName: 'Amine - Constantine',
    rating: 5,
    comment: 'Finition Blue Edition propre et moteur 9000 RPM puissant. Les 10 sabots suffisent largement.',
    createdAt: '2026-08-29T10:30:00Z'
  },
  {
    productId: 814,
    customerName: 'حمزة - تيزي وزو',
    rating: 4,
    comment: 'شابة وقوية وتخدم وقت طويل بلا شارج، غير الوزن تاعها شوية معمر بصح مليحة.',
    createdAt: '2026-11-05T15:20:00Z'
  },

  // 817 - VGR V-694 3-en-1 (2 avis : 5 & 4 -> moy 4.5)
  {
    productId: 817,
    customerName: 'فارس - عنابة',
    rating: 5,
    comment: 'باك كامل فيه كلش، التوندوز والتريمر والشافور مع القاعدة، وفر عليا بزاف.',
    createdAt: '2026-09-12T13:15:00Z'
  },
  {
    productId: 817,
    customerName: 'Sofiane - Béjaïa',
    rating: 4,
    comment: 'Pratique d’avoir les 3 machines et le socle de charge sur le comptoir. Rien à redire.',
    createdAt: '2026-11-18T09:50:00Z'
  },

  // 818 - VGR V-640 Barber Combo (2 avis : 4 & 4 -> moy 4.0)
  {
    productId: 818,
    customerName: 'Réda - Tlemcen',
    rating: 4,
    comment: 'Bon duo en métal pour débuter en salon, les lames DLC coupent proprement dès la sortie de boîte.',
    createdAt: '2026-09-21T17:40:00Z'
  },
  {
    productId: 818,
    customerName: 'أيوب - باتنة',
    rating: 4,
    comment: 'جوج ماكينات حديد صحاح وخدمتهم نقية في الكونتور والتدريج، السعر معقول.',
    createdAt: '2026-11-02T12:10:00Z'
  },

  // 624 - VGR V-285 (2 nouveaux avis : 4 & 4 -> moy avec existant (5+4+4)/3 = 4.3)
  {
    productId: 624,
    customerName: 'بلال - الشلف',
    rating: 4,
    comment: 'ماكينة مخدومة بالحديد وعملية بزاف بالشاحن USB-C، تقطع مليح بلا ما تجبد الشعر.',
    createdAt: '2026-08-22T19:00:00Z'
  },
  {
    productId: 624,
    customerName: 'Mehdi K. - Blida',
    rating: 4,
    comment: 'Solide, bonne prise en main et charge Type-C rapide. Très bon rapport qualité-prix en promo.',
    createdAt: '2026-10-28T11:35:00Z'
  },

  // 812 - VGR V-374 (2 avis : 4 & 4 -> moy 4.0)
  {
    productId: 812,
    customerName: 'Adel - Alger',
    rating: 4,
    comment: 'Rase à blanc sans irriter la peau sur le cou et les finitions de dégradé. Écran LED pratique.',
    createdAt: '2026-09-09T09:25:00Z'
  },
  {
    productId: 812,
    customerName: 'سفيان - سكيكدة',
    rating: 4,
    comment: 'راوزار دو غري مليح بزاف للتشطيب والزيرو، خفيف وما يديرش حرق في الرقبة.',
    createdAt: '2026-11-14T20:15:00Z'
  },

  // 808 - VGR V-996 (2 avis : 5 & 4 -> moy 4.5)
  {
    productId: 808,
    customerName: 'نجيب - البويرة',
    rating: 5,
    comment: 'بسعر 4500 دج هايلة بزاف، البطارية تشد مدة طويلة وتخدم مليح للحية والشعر.',
    createdAt: '2026-09-29T15:50:00Z'
  },
  {
    productId: 808,
    customerName: 'Youcef - Tipaza',
    rating: 4,
    comment: 'Simple, efficace pour l’entretien à la maison et autonomie impressionnante à ce prix.',
    createdAt: '2026-11-08T14:25:00Z'
  },

  // 809 - VGR V-930 (2 avis : 3 & 4 -> moy 3.5)
  {
    productId: 809,
    customerName: 'Tarek - Annaba',
    rating: 4,
    comment: 'Bonne petite tondeuse pour les contours et la barbe, USB-C pratique et bonne autonomie.',
    createdAt: '2026-08-17T13:05:00Z'
  },
  {
    productId: 809,
    customerName: 'عمر - بومرداس',
    rating: 3,
    comment: 'مليحة للحية والكونتور بسعرها، برك السرعة متوسطة ماشي تاع شعر خشين بزاف.',
    createdAt: '2026-10-12T17:30:00Z'
  },

  // 810 - VGR V-972 (1 nouvel avis : 4 -> moy avec existant (5+4)/2 = 4.5)
  {
    productId: 810,
    customerName: 'رابح - جيجل',
    rating: 4,
    comment: 'صغيرة وخفيفة وتخدم بالسلك ولا بلا سلك، مليحة بزاف للاستعمال اليومي في الدار.',
    createdAt: '2026-10-23T10:15:00Z'
  },

  // 811 - VGR V-906 (1 nouvel avis : 5 -> moy avec existant (5+5)/2 = 5.0)
  {
    productId: 811,
    customerName: 'Hichem Barber - Médéa',
    rating: 5,
    comment: 'Trimmer T-Blade précis à 9000 RPM, trace net les contours de barbe sans agresser la peau.',
    createdAt: '2026-11-20T16:10:00Z'
  }
];

async function seedVgrReviews() {
  console.log(`🌱 Inserting ${vgrReviews.length} VGR customer reviews...`);

  let inserted = 0;
  for (const rev of vgrReviews) {
    const existing = await sql`
      SELECT id FROM reviews
      WHERE product_id = ${rev.productId}
        AND customer_name = ${rev.customerName}
        AND comment = ${rev.comment}
    `;

    if (existing.length > 0) {
      console.log(`Skipping duplicate review for product ${rev.productId} by ${rev.customerName}`);
      continue;
    }

    await sql`
      INSERT INTO reviews (product_id, customer_name, rating, comment, status, created_at)
      VALUES (${rev.productId}, ${rev.customerName}, ${rev.rating}, ${rev.comment}, 'approved', ${rev.createdAt})
    `;
    inserted++;
  }

  console.log(`✅ Inserted ${inserted} VGR reviews.`);

  const summary = await sql`
    SELECT p.id, p.name, COUNT(r.id)::int AS review_count, ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
    FROM products p
    LEFT JOIN reviews r ON r.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE b.slug = 'vgr-tondeuse-rasoir-algerie'
    GROUP BY p.id, p.name
    ORDER BY p.id
  `;
  console.table(summary);

  await sql.end();
}

seedVgrReviews().catch((err) => {
  console.error('Error seeding VGR reviews:', err);
  process.exit(1);
});
