import { sql } from './setup.ts';

async function seedVgrProCombosBlog() {
  console.log('🌱 Seeding non-cannibalizing SEO & GEO blog article for uncovered VGR clippers & barber combos on ZORANDO...');

  const generateShowcase = (
    products: Array<{
      name: string;
      slug: string;
      price: number;
      promoPrice?: number | null;
      image: string;
      badge: string;
      spec: string;
    }>
  ) => `
<div class="mt-10 pt-8 border-t border-gray-200">
  <div class="bg-gradient-to-r from-gray-900 via-neutral-900 to-black rounded-2xl p-6 text-white mb-6 shadow-md border border-gray-800">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <span class="inline-block bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">Catalogue VGR Algérie • ZORANDO</span>
        <h3 class="text-xl font-extrabold text-white m-0">Commandez votre tondeuse VGR originale au meilleur prix en Algérie</h3>
        <p class="text-gray-300 text-sm mt-1 mb-0">Stock vérifié, livraison rapide dans les 58 wilayas d'Algérie et paiement à la livraison.</p>
      </div>
      <a href="/brands/vgr-tondeuse-rasoir-algerie" class="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-all text-sm shrink-0 no-underline">
        Voir tout VGR →
      </a>
    </div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    ${products
      .map(
        (p) => `
      <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <img src="${p.image}" alt="${p.name.replace(/"/g, '&quot;')}" loading="lazy" class="max-h-36 max-w-full object-contain p-2" />
            <span class="absolute top-2 left-2 bg-gray-900 text-white text-[11px] font-bold px-2 py-0.5 rounded">${p.badge}</span>
          </div>
          <h4 class="font-bold text-gray-900 text-sm leading-snug mb-1">${p.name}</h4>
          <p class="text-xs text-gray-500 mb-2">${p.spec}</p>
        </div>
        <div class="pt-3 border-t border-gray-100 flex items-center justify-between mt-2">
          <div>
            ${
              p.promoPrice
                ? `<div class="text-xs text-gray-400 line-through">${p.price.toLocaleString('fr-FR')} DA</div>
                   <div class="text-base font-black text-orange-600">${p.promoPrice.toLocaleString('fr-FR')} DA</div>`
                : `<div class="text-base font-black text-gray-900">${p.price.toLocaleString('fr-FR')} DA</div>`
            }
          </div>
          <a href="/product/${p.slug}" class="bg-gray-900 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors no-underline">
            Voir la fiche
          </a>
        </div>
      </div>`
      )
      .join('')}
  </div>
</div>`;

  // =========================================================================
  // ARTICLE : COMPARATIF DES TONDEUSES VGR NON COUVERTES (V-668, V-285, V-640, V-694, V-996)
  // Anti-cannibalisation stricte :
  // - Blog 27 cible uniquement la VGR V-001 (9000 RPM monocoupe)
  // - Blog 28 cible uniquement les finitions & shavers (V-374, V-906, V-930, V-972)
  // - Cet article cible les moteurs Vector 11 000 tr/min, coupes métalliques et kits Barber Combo / 3-en-1
  // Mots-clés principaux : tondeuse vgr algerie prix, vgr v668 vector, vgr v640 barber combo, vgr v694 3 en 1, vgr v285, vgr v996
  // =========================================================================
  const title =
    'Tondeuses VGR en Algérie : comparatif V-668 Vector, V-285, V-640 Barber Combo, V-694 3-en-1 et V-996 (Prix 2026)';
  const slug =
    'tondeuse-vgr-algerie-comparatif-v668-v285-v640-v694-v996-prix-avis';
  const seoTitle =
    'Tondeuse VGR Prix Algérie (4 500 à 16 000 DA) : V-668, V-285, V-640 & V-694 | ZORANDO';
  const seoDesc =
    'Comparatif des tondeuses VGR en Algérie (V-668 moteur Vector 11 000 tr/min, V-285 9000 RPM USB-C, coffret V-640 Barber Combo, kit V-694 3-en-1 et V-996 dès 4 500 DA). Prix réels ZORANDO 58 wilayas.';
  const excerpt =
    'Quel modèle VGR choisir en Algérie au-delà de la V-001 et des trimmers de finition ? Comparatif complet et prix en dinars (4 500 DA à 16 000 DA) des tondeuses VGR V-668 Vector 11 000 tr/min, V-285, V-640 Barber Combo, V-694 3-en-1 et V-996 sur ZORANDO.';

  const imgMain =
    'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuse-a-cheveux-professionnelle-vgr-v-668-1-2dq1vd.webp';
  const img1 =
    'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/migrated-products-624-image-1786547233627.webp';
  const img2 =
    'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuses-professionnelles-vgr-v-640-barber-combo-1-46pbcj.webp';
  const img3 =
    'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1-1-k66k7g.webp';

  const content = `
<p>
  <strong>En bref :</strong> en Algérie, la gamme de tondeuses professionnelles <strong>VGR</strong> disponible sur <a href="/brands/vgr-tondeuse-rasoir-algerie"><strong>ZORANDO</strong></a> s’étend de <strong>4 500 DA à 16 000 DA</strong> selon la motorisation et le nombre d’appareils inclus. Si vous cherchez une tondeuse de coupe ou un coffret complet autre que la V-001, cinq modèles se distinguent : la <strong>VGR V-668</strong> à moteur Vector 11 000 tr/min (<strong>16 000 DA</strong>), le kit <strong>VGR V-694 3-en-1</strong> (<strong>16 000 DA</strong>), le duo <strong>VGR V-640 Barber Combo</strong> (<strong>12 500 DA</strong>), la <strong>VGR V-285</strong> à corps métallique 9 000 tr/min (<strong>8 500 DA</strong> en promo) et la polyvalente <strong>VGR V-996</strong> (<strong>4 500 DA</strong>).
</p>

<p>
  Pour éviter toute confusion avec nos précédents essais, rappelons que nous avons déjà consacré un dossier détaillé à la <a href="/blog/tondeuse-vgr-v001-algerie-avis-test-9000rpm-prix-2026"><strong>tondeuse VGR V-001 (9000 RPM)</strong></a> ainsi qu’un guide complet aux <a href="/blog/tondeuse-finition-rasoir-shaver-vgr-algerie-comparatif-prix-2026"><strong>tondeuses de finition et rasoirs shaver VGR (V-374, V-906, V-930, V-972)</strong></a>. Ce nouveau comparatif passe au crible les <strong>5 références VGR restantes du catalogue</strong> — des tondeuses à moteur Vector ultra-rapide aux packs Barber multi-machines — avec uniquement les caractéristiques techniques vérifiées en boutique.
</p>

<h2>1. VGR V-668 (16 000 DA) : la puissance du moteur Vector jusqu’à 11 000 tr/min</h2>
<p>
  Parmi les tondeuses de coupe professionnelles de la marque, la <a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-668"><strong>VGR V-668</strong></a> occupe une place à part grâce à son <strong>moteur Vector</strong> capable d’atteindre une vitesse de <strong>8 000 à 11 000 tours par minute</strong>. Là où la majorité des tondeuses classiques tournent entre 6 000 et 7 500 tr/min, cette fréquence de coupe très élevée permet de traverser les cheveux épais ou crépus sans ralentir ni tirer.
</p>
<ul>
  <li><strong>Lames et précision de dégradé :</strong> elle associe une lame en <strong>céramique</strong> avec des éléments à <strong>revêtement DLC</strong> (Diamond-Like Carbon), pilotée par un <strong>levier réglable sur 5 positions (0,8 à 2 mm)</strong> et accompagnée de <strong>6 sabots</strong> (1,5 / 3 / 4,5 / 6 / 9 / 12 mm).</li>
  <li><strong>Endurance et affichage :</strong> sa batterie Lithium-ion de <strong>2 500 mAh</strong> assure jusqu’à <strong>250 minutes d’autonomie</strong> pour environ 3,5 heures de charge (entrée 5V/1A), avec suivi sur <strong>écran LED</strong>.</li>
  <li><strong>Pour qui ?</strong> Les barbiers en salon qui enchaînent les dégradés exigeants et les particuliers voulant la motorisation la plus nerveuse du rayon <a href="/category/beaute-soins-homme?sub=true"><strong>Beauté &amp; Soins Homme</strong></a>.</li>
</ul>

<h2>2. VGR V-285 (8 500 DA en promo) : la tondeuse métal 9 000 RPM au meilleur rapport qualité/prix</h2>
<p>
  Affichée à <strong>8 500 DA</strong> en promotion (au lieu de 8 900 DA), la <a href="/product/tondeuse-professionnelle-vgr-v-285-sans-fil-9000-rpm-batterie-2000-mah-usb-c"><strong>tondeuse professionnelle VGR V-285</strong></a> s’adresse à ceux qui veulent une vraie tondeuse de coupe rapide à moins de 9 000 DA sans passer à la gamme à 13 500–16 000 DA.
</p>
<ul>
  <li><strong>Motorisation 7 500 à 9 000 tr/min :</strong> vitesse réglable pour s’adapter aussi bien aux cheveux denses qu’aux finitions et à l’entretien de la barbe.</li>
  <li><strong>Lame céramique + acier à poudre métallurgique :</strong> pensée pour limiter l’échauffement durant les séances prolongées et résister à l’usure.</li>
  <li><strong>Corps métallique &amp; USB Type-C :</strong> prise en main solide, levier de coupe de <strong>0,8 à 2 mm</strong>, <strong>6 sabots</strong> (1,5 / 3 / 4,5 / 6 / 10 / 13 mm), écran LED et batterie <strong>2 000 mAh</strong> offrant jusqu’à <strong>150 minutes d’autonomie</strong> après 2 h 30 de charge via USB-C.</li>
</ul>

<h2>3. VGR V-640 Barber Combo (12 500 DA) : le duo métal tondeuse + trimmer à 9 000 tr/min</h2>
<p>
  Si vous démarrez un poste de coiffure ou souhaitez entretenir chez vous cheveux, dégradés et contours de barbe nets sans acheter deux machines séparément, le coffret <a href="/product/tondeuses-professionnelles-vgr-v-640-barber-combo"><strong>VGR V-640 Barber Combo</strong></a> réunit <strong>1 tondeuse de coupe + 1 trimmer de précision</strong> dans un habillage en <strong>corps métallique</strong> avec affichage LED et recharge USB, pour <strong>12 500 DA</strong>.
</p>
<ul>
  <li><strong>Performance commune :</strong> moteur haute vitesse atteignant <strong>jusqu’à 9 000 tr/min</strong>, lame fixe avec <strong>revêtement DLC</strong> et lame mobile en <strong>céramique</strong>.</li>
  <li><strong>Tondeuse principale :</strong> batterie <strong>2 500 mAh</strong> pour jusqu’à <strong>250 minutes d’autonomie</strong> (charge environ 3 h) et <strong>6 sabots de 1,5 à 12 mm</strong>.</li>
  <li><strong>Trimmer de finition :</strong> batterie <strong>2 000 mAh</strong> offrant jusqu’à <strong>240 minutes d’autonomie</strong> (charge environ 2,5 h) avec <strong>3 guides de 1 à 3 mm</strong> pour les contours de nuque, tempes et barbe.</li>
</ul>

<h2>4. VGR V-694 3-en-1 (16 000 DA) : le kit complet Clipper + Trimmer + Rasoir Foil</h2>
<p>
  À tarif identique à la V-668 (<strong>16 000 DA</strong>), la <a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1"><strong>VGR V-694 3-en-1</strong></a> fait le pari inverse : au lieu d’un seul appareil très haute vitesse, elle vous livre un <strong>atelier complet de 3 appareils sans fil</strong> avec affichage LED, <strong>base de charge</strong>, 2 câbles, 3 capuchons, brosse et huile lubrifiante :
</p>
<ol>
  <li><strong>La tondeuse de coupe (Clipper) :</strong> batterie <strong>2 500 mAh</strong> (jusqu’à <strong>240 min</strong> d’autonomie, charge ~3,5 h), vitesse ~<strong>7 000 tr/min</strong>, lames céramique + acier inoxydable, levier ~<strong>0,5 à 2 mm</strong> et <strong>6 sabots</strong> (1,5 / 3 / 4,5 / 6 / 10 / 13 mm).</li>
  <li><strong>Le trimmer de précision :</strong> batterie <strong>1 400 mAh</strong> (jusqu’à <strong>200 min</strong>, charge ~2 h), vitesse <strong>7 000 tr/min</strong>, plage de coupe ~<strong>0,2 à 5 mm</strong> et <strong>5 sabots</strong> (1 / 2 / 3 / 4 / 5 mm).</li>
  <li><strong>Le rasoir à grille (Foil Shaver) :</strong> batterie <strong>1 400 mAh</strong> (jusqu’à <strong>150 min</strong>, charge ~2 h), vitesse <strong>7 500 tr/min</strong> avec tête à grille métallique pour le rasage de près et les dégradés à blanc.</li>
</ol>
<p>
  Avec <strong>11 sabots de guidage au total</strong>, la V-694 évite tout achat complémentaire lorsque vous voulez passer de la coupe principale aux contours puis au rasage lisse à zéro.
</p>

<h2>5. VGR V-996 (4 500 DA) : l’option accessible à 300 minutes d’autonomie</h2>
<p>
  Pour un budget maîtrisé sous la barre des 5 000 DA, la <a href="/product/vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm"><strong>VGR V-996</strong></a> (<strong>4 500 DA</strong>) mise sur la simplicité et l’endurance. Son moteur tourne jusqu’à <strong>7 000 tr/min</strong> avec des lames en <strong>céramique à revêtement titane</strong>, tandis que sa batterie lithium de <strong>2 000 mAh</strong> revendique jusqu’à <strong>300 minutes d’utilisation</strong> après environ 3 heures de charge USB. Fournie avec <strong>4 peignes guides</strong> (1,5 / 3 / 4,5 / 6 mm), elle couvre efficacement l’entretien régulier des cheveux courts, de la barbe et de la moustache à la maison.
</p>

<h2>Tableau comparatif des 5 tondeuses VGR (Prix &amp; Fiches Techniques ZORANDO)</h2>
<table>
  <thead>
    <tr>
      <th>Modèle VGR</th>
      <th>Configuration</th>
      <th>Moteur &amp; Vitesse</th>
      <th>Lames</th>
      <th>Batterie &amp; Autonomie</th>
      <th>Guides / Sabots</th>
      <th>Prix Algérie (ZORANDO)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-668"><strong>VGR V-668</strong></a></td>
      <td>Tondeuse pro seule</td>
      <td>Vector 8 000 – 11 000 tr/min</td>
      <td>Céramique + revêtement DLC</td>
      <td>2 500 mAh (jusqu’à 250 min)</td>
      <td>Levier 0,8–2 mm + 6 sabots (1,5–12 mm)</td>
      <td><strong>16 000 DA</strong></td>
    </tr>
    <tr>
      <td><a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1"><strong>VGR V-694 3-en-1</strong></a></td>
      <td>Clipper + Trimmer + Foil Shaver</td>
      <td>7 000 / 7 000 / 7 500 tr/min</td>
      <td>Céramique + inox / grille</td>
      <td>2 500 + 1 400 + 1 400 mAh (240 / 200 / 150 min)</td>
      <td>11 sabots au total + base de charge</td>
      <td><strong>16 000 DA</strong></td>
    </tr>
    <tr>
      <td><a href="/product/tondeuses-professionnelles-vgr-v-640-barber-combo"><strong>VGR V-640 Barber Combo</strong></a></td>
      <td>Tondeuse + Trimmer métal</td>
      <td>Jusqu’à 9 000 tr/min</td>
      <td>Fixe DLC + mobile céramique</td>
      <td>2 500 mAh (250 min) + 2 000 mAh (240 min)</td>
      <td>6 sabots (1,5–12 mm) + 3 guides (1–3 mm)</td>
      <td><strong>12 500 DA</strong></td>
    </tr>
    <tr>
      <td><a href="/product/tondeuse-professionnelle-vgr-v-285-sans-fil-9000-rpm-batterie-2000-mah-usb-c"><strong>VGR V-285</strong></a></td>
      <td>Tondeuse pro métal</td>
      <td>7 500 – 9 000 tr/min</td>
      <td>Céramique + acier poudre</td>
      <td>2 000 mAh (150 min, USB-C)</td>
      <td>Levier 0,8–2 mm + 6 sabots (1,5–13 mm)</td>
      <td><strong>8 500 DA</strong> (promo)</td>
    </tr>
    <tr>
      <td><a href="/product/vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm"><strong>VGR V-996</strong></a></td>
      <td>Tondeuse cheveux &amp; barbe</td>
      <td>Jusqu’à 7 000 tr/min</td>
      <td>Céramique revêtement titane</td>
      <td>2 000 mAh (jusqu’à 300 min)</td>
      <td>4 sabots (1,5 / 3 / 4,5 / 6 mm)</td>
      <td><strong>4 500 DA</strong></td>
    </tr>
  </tbody>
</table>

<h2>Guide de décision rapide : quel modèle VGR correspond à votre besoin ?</h2>
<div class="my-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
  <ul class="text-sm space-y-2 text-gray-800 m-0">
    <li><strong>Vous voulez la vitesse de coupe maximale pour cheveux très épais ou salon :</strong> optez pour la <a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-668"><strong>VGR V-668</strong></a> (16 000 DA), seule de la liste équipée d’un moteur Vector montant à 11 000 tr/min.</li>
    <li><strong>Vous voulez équiper un poste complet en une seule commande :</strong> prenez la <a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1"><strong>VGR V-694 3-en-1</strong></a> (16 000 DA) si vous avez aussi besoin d’un rasoir à grille foil, ou le duo <a href="/product/tondeuses-professionnelles-vgr-v-640-barber-combo"><strong>VGR V-640 Barber Combo</strong></a> (12 500 DA) si vous privilégiez le corps métallique à 9 000 tr/min.</li>
    <li><strong>Vous cherchez une seule machine solide à moins de 9 000 DA :</strong> la <a href="/product/tondeuse-professionnelle-vgr-v-285-sans-fil-9000-rpm-batterie-2000-mah-usb-c"><strong>VGR V-285</strong></a> (8 500 DA en promo) offre un boîtier métallique, 9 000 tr/min et la charge USB-C.</li>
    <li><strong>Vous cherchez un premier prix endurant pour barbe et cheveux courts :</strong> la <a href="/product/vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm"><strong>VGR V-996</strong></a> (4 500 DA) combine 7 000 tr/min et jusqu’à 300 minutes d’autonomie.</li>
  </ul>
</div>
<p>
  Besoin de comparer également avec d’autres marques populaires en Algérie (Kemei, Philips, Mioco) ? Parcourez notre rayon complet <a href="/category/rasage-et-epilation?subsub=true"><strong>Rasage et épilation sur ZORANDO</strong></a> ou relisez notre <a href="/blog/tondeuse-cheveux-guide-complet-2026-meilleures-marques-en-algerie"><strong>guide général des tondeuses cheveux en Algérie</strong></a>.
</p>

<h2>Foire Aux Questions (FAQ) : Tondeuses VGR en Algérie</h2>

<h3>1. Quel est le prix d’une tondeuse VGR en Algérie en 2026 ?</h3>
<p>
  Sur <a href="/brands/vgr-tondeuse-rasoir-algerie"><strong>ZORANDO Algérie</strong></a>, les tondeuses VGR étudiées dans ce guide coûtent entre <strong>4 500 DA</strong> (VGR V-996) et <strong>16 000 DA</strong> (VGR V-668 à moteur Vector ou coffret VGR V-694 3-en-1), avec les choix intermédiaires V-285 à <strong>8 500 DA</strong> en promo et V-640 Barber Combo à <strong>12 500 DA</strong>.
</p>

<h3>2. Quelle différence entre la VGR V-668 (16 000 DA) et la VGR V-285 (8 500 DA) ?</h3>
<p>
  La <strong>VGR V-668</strong> embarque un <strong>moteur Vector jusqu’à 11 000 tr/min</strong>, une lame céramique avec revêtement DLC et une batterie 2 500 mAh offrant jusqu’à 250 minutes d’autonomie. La <strong>VGR V-285</strong> tourne à 7 500–9 000 tr/min avec une batterie 2 000 mAh (150 minutes), recharge USB Type-C et un prix presque deux fois plus accessible.
</p>

<h3>3. Vaut-il mieux acheter le VGR V-640 Barber Combo ou le kit VGR V-694 3-en-1 ?</h3>
<p>
  Choisissez le <a href="/product/tondeuses-professionnelles-vgr-v-640-barber-combo"><strong>VGR V-640 Barber Combo (12 500 DA)</strong></a> si vous voulez une tondeuse + un trimmer à <strong>corps métallique</strong> montant jusqu’à <strong>9 000 tr/min</strong> avec grande autonomie (250 + 240 min). Choisissez le <a href="/product/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1"><strong>VGR V-694 3-en-1 (16 000 DA)</strong></a> si vous souhaitez en plus un <strong>rasoir foil à grille</strong> et une base de charge avec 11 sabots inclus.
</p>

<h3>4. Quelle tondeuse VGR choisir pour un usage maison à petit budget en Algérie ?</h3>
<p>
  La <a href="/product/vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm"><strong>VGR V-996 à 4 500 DA</strong></a> est idéale à domicile : elle délivre 7 000 tr/min avec lames céramique-titane, 4 sabots (1,5 à 6 mm) et jusqu’à 300 minutes d’autonomie.
</p>

<h3>5. Où commander ces tondeuses VGR originales avec paiement à la livraison en Algérie ?</h3>
<p>
  Toutes ces références sont disponibles en stock sur <a href="/brands/vgr-tondeuse-rasoir-algerie"><strong>ZORANDO</strong></a> avec expédition rapide dans les 58 wilayas d’Algérie et règlement en espèces à la réception de votre colis.
</p>

${generateShowcase([
  {
    name: 'Tondeuse à cheveux professionnelle VGR V-668',
    slug: 'tondeuse-a-cheveux-professionnelle-vgr-v-668',
    price: 16000,
    promoPrice: null,
    image:
      'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuse-a-cheveux-professionnelle-vgr-v-668-1-2dq1vd.webp',
    badge: 'Moteur Vector 11 000 RPM',
    spec: '8000–11000 tr/min • DLC + Céramique • 2500 mAh (250 min)'
  },
  {
    name: 'Tondeuse Professionnelle VGR V-285 – Sans Fil 9000 RPM',
    slug: 'tondeuse-professionnelle-vgr-v-285-sans-fil-9000-rpm-batterie-2000-mah-usb-c',
    price: 8900,
    promoPrice: 8500,
    image:
      'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/migrated-products-624-image-1786547233627.webp',
    badge: 'Corps Métal • USB-C',
    spec: '7500–9000 RPM • 6 sabots (1,5–13 mm) • 2000 mAh'
  },
  {
    name: 'Tondeuses professionnelles VGR V-640 – Barber Combo',
    slug: 'tondeuses-professionnelles-vgr-v-640-barber-combo',
    price: 12500,
    promoPrice: null,
    image:
      'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuses-professionnelles-vgr-v-640-barber-combo-1-46pbcj.webp',
    badge: 'Duo Clipper + Trimmer',
    spec: '9000 tr/min • Lames DLC/Céramique • 250 + 240 min'
  },
  {
    name: 'Tondeuse à cheveux professionnelle VGR V-694 3-en-1',
    slug: 'tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1',
    price: 16000,
    promoPrice: null,
    image:
      'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/tondeuse-a-cheveux-professionnelle-vgr-v-694-3-en-1-1-k66k7g.webp',
    badge: 'Kit Pro 3-en-1',
    spec: 'Clipper + Trimmer + Rasoir Foil • 11 sabots • Base incluse'
  },
  {
    name: 'VGR V-996 – Tondeuse à Cheveux et Barbe Sans Fil 7000 RPM',
    slug: 'vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm',
    price: 4500,
    promoPrice: null,
    image:
      'https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/vgr-v-996-tondeuse-a-cheveux-et-barbe-sans-fil-7000-rpm-1-p5ifmj.webp',
    badge: 'Meilleur Prix • 300 min',
    spec: '7000 RPM • Lames céramique-titane • 2000 mAh'
  }
])}
`;

  const mainAlt =
    'Comparatif tondeuses professionnelles VGR V-668 Vector, V-285, V-640 Barber Combo et V-694 3-en-1 en Algérie';
  const img1Alt = 'Tondeuse professionnelle VGR V-285 corps métallique 9000 RPM USB-C prix Algérie';
  const img2Alt = 'Coffret VGR V-640 Barber Combo tondeuse et trimmer DLC céramique en Algérie';
  const img3Alt = 'Kit 3-en-1 VGR V-694 tondeuse trimmer et rasoir foil sur ZORANDO Algérie';

  const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug}`;
  if (existing.length > 0) {
    console.log(`Updating existing post: ${slug}`);
    await sql`
      UPDATE blog_posts
      SET
        title = ${title},
        excerpt = ${excerpt},
        content = ${content},
        seo_title = ${seoTitle},
        seo_description = ${seoDesc},
        image_url = ${imgMain},
        main_image_alt = ${mainAlt},
        image_1_url = ${img1},
        image_1_alt = ${img1Alt},
        image_2_url = ${img2},
        image_2_alt = ${img2Alt},
        image_3_url = ${img3},
        image_3_alt = ${img3Alt},
        category_id = 2,
        status = 'published',
        published_at = NOW(),
        updated_at = NOW()
      WHERE slug = ${slug}
    `;
  } else {
    console.log(`Inserting new post: ${slug}`);
    await sql`
      INSERT INTO blog_posts (
        title,
        slug,
        excerpt,
        content,
        seo_title,
        seo_description,
        image_url,
        main_image_alt,
        image_1_url,
        image_1_alt,
        image_2_url,
        image_2_alt,
        image_3_url,
        image_3_alt,
        category_id,
        status,
        published_at,
        created_at,
        updated_at
      ) VALUES (
        ${title},
        ${slug},
        ${excerpt},
        ${content},
        ${seoTitle},
        ${seoDesc},
        ${imgMain},
        ${mainAlt},
        ${img1},
        ${img1Alt},
        ${img2},
        ${img2Alt},
        ${img3},
        ${img3Alt},
        2,
        'published',
        NOW(),
        NOW(),
        NOW()
      )
    `;
  }

  console.log('✅ Successfully seeded VGR Pro & Barber Combo blog article!');
  await sql.end();
}

seedVgrProCombosBlog().catch((err) => {
  console.error('Error seeding VGR blog:', err);
  process.exit(1);
});
