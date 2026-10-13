import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { Product } from '../store/cartStore';
import { fetchWithCache } from '../lib/utils';
import { ChevronRight, BookOpen, ArrowRight } from 'lucide-react';

interface ExtractedCategory {
  id: number;
  name: string;
  slug: string;
  level: 'category' | 'subcategory' | 'sub_subcategory';
}

export default function BrandProducts() {
  const { slug, categorySlug } = useParams();
  const [brand, setBrand] = useState<any>(null);
  const [brandCategories, setBrandCategories] = useState<ExtractedCategory[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let currentBrandId: number;

    setLoading(true);

    // Fetch brand details first
    fetch(`/api/brands/${slug}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error('Brand not found');
        return res.json();
      })
      .then(data => {
        setBrand(data);
        currentBrandId = data.id;
        
        // Fetch brand categories first to know the level of the categorySlug
        return fetchWithCache(`/api/brands/${slug}/categories`, { signal, maxAge: 60000 });
      })
      .then((catsData: ExtractedCategory[]) => {
        if (Array.isArray(catsData)) {
          setBrandCategories(catsData);
        }
        
        let productsUrl = `/api/products?brand=${currentBrandId}&limit=100`;
        
        if (categorySlug && Array.isArray(catsData)) {
          const matchedCategory = catsData.find(c => c.slug === categorySlug);
          if (matchedCategory) {
            productsUrl += `&${matchedCategory.level}=${categorySlug}`;
          }
        }

        return fetchWithCache(productsUrl, { signal, maxAge: 60000 });
      })
      .then(prodsData => {
        if (Array.isArray(prodsData)) {
          setDisplayedProducts(prodsData);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch brand data", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug, categorySlug]);

  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    return brandCategories.find(c => c.slug === categorySlug) || null;
  }, [brandCategories, categorySlug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="Marque introuvable" description="La marque demandée n'existe pas." noindex={true} />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Marque introuvable</h1>
        <p className="text-gray-600 mb-8">La marque que vous recherchez n'existe pas ou a été supprimée.</p>
        <Link to="/brands" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors">
          Voir toutes les marques
        </Link>
      </div>
    );
  }

  // --- SEO & Content Generation ---
  
  const isCategoryPage = !!categorySlug && !!currentCategory;
  
  // Base URLs
  const baseUrl = `https://www.zorando.com/brands/${brand.slug}`;
  const canonicalUrl = isCategoryPage ? `${baseUrl}/${currentCategory.slug}` : baseUrl;
  
  // Titles & H1
  let pageTitle = '';
  let h1Title = '';
  let metaDescription = '';
  let seoIntro = null;

const ROBUSTE_FAQ = [
  {
    q: "Quels sont les meilleurs appareils électroménagers ROBUSTE en Algérie ?",
    a: "Parmi les appareils ROBUSTE les plus plébiscités en Algérie figurent la machine à café Expresso Roma (15 bars), la friteuse sans huile Airfryer AF10 10L à double résistance et fenêtre tactile, le robot pétrin PRO MAX pour les pâtes traditionnelles, et le nettoyeur de taches vapeur Proclean 4-en-1."
  },
  {
    q: "Quel est le prix des appareils ROBUSTE chez ZORANDO en Algérie ?",
    a: "Les prix des produits ROBUSTE débutent dès 3 300 DZD pour les petits appareils (cafetières compactes, batteurs, presse-agrumes) et vont jusqu'à 24 000 - 25 500 DZD pour les modèles professionnels comme l'Airfryer AF10 10L ou le nettoyeur vapeur Proclean. Tous les prix sont affichés en Dinars Algériens (DZD) avec promotions régulières."
  },
  {
    q: "Le robot pétrin ROBUSTE est-il adapté pour le pain maison et la Kesra algérienne ?",
    a: "Oui, le robot pétrin Robuste PRO MAX est équipé d'un moteur robuste à transmission renforcée et d'un bol inox grande capacité, spécialement adapté au pétrissage des pâtes lourdes traditionnelles comme la Kesra, le Khobz Dar et les pâtes à pizza."
  },
  {
    q: "Les appareils ROBUSTE sont-ils garantis et livrés dans les 58 wilayas ?",
    a: "Absolument. Tous les produits ROBUSTE commandés sur ZORANDO sont 100% originaux et couverts par une garantie officielle. La livraison est assurée rapidement à domicile ou en point relais dans les 58 wilayas d'Algérie avec paiement à la livraison après inspection de votre colis."
  }
];

const SONASHI_FAQ = [
  {
    q: "Quels sont les meilleurs appareils électroménagers SONASHI en Algérie ?",
    a: "Parmi les appareils Sonashi les plus vendus et recommandés en Algérie figurent l'Air Fryer SAF-642G 1600W à double bac en verre (10,2L), la machine à café expresso SCM-4984 3-en-1 (20 bars, compatible capsules Nespresso, Dolce Gusto et café moulu), la cocotte minute autocuiseur Inox 6L SPC-021 avec minuterie, et l'aspirateur cuve inox 30L eau et poussière SVC-9030D (1600W avec souffleur)."
  },
  {
    q: "Quelle est l'origine de la marque SONASHI et est-elle de bonne qualité ?",
    a: "Sonashi est une marque internationale originaire de Dubaï (Émirats Arabes Unis), développée par le groupe Sonashi International FZE. En Algérie, elle est réputée pour sa durabilité (« Heavy Duty »), ses finitions en inox épais (cuves, bouilloires, autocuiseurs) et ses moteurs fiables, offrant un rapport qualité-prix remarquable nettement supérieur aux marques d'entrée de gamme."
  },
  {
    q: "Quel est le prix des appareils SONASHI chez ZORANDO en Algérie ?",
    a: "Les prix des produits Sonashi chez ZORANDO débutent dès 3 300 DZD pour les bras mixeurs plongeants et vont jusqu'à 25 900 DZD pour l'Air Fryer haute capacité SAF-642G 10,2L à double bac en verre. Les machines à expresso sont proposées entre 13 400 et 16 500 DZD, et les cocottes minutes inox 6L entre 18 200 et 21 200 DZD avec promotions régulières."
  },
  {
    q: "La machine à café Sonashi SCM-4984 est-elle compatible Nespresso et Dolce Gusto ?",
    a: "Oui, la machine Sonashi SCM-4984 20 bars est un modèle 3-en-1 équipé de 3 tiroirs adaptateurs interchangeables : un pour capsules type Nespresso Original, un pour capsules Dolce Gusto, et un porte-filtre pour café moulu classique."
  },
  {
    q: "Les appareils SONASHI sont-ils authentiques et garantis avec livraison 58 wilayas ?",
    a: "Absolument. Tous les produits Sonashi vendus par ZORANDO sont 100% authentiques avec garantie officielle constructeur. La livraison est assurée rapidement à domicile ou en point relais dans les 58 wilayas d'Algérie avec paiement à la livraison après inspection de votre colis."
  }
];

  let bottomSeoContent = null;
  if (currentCategory) {
    const catName = currentCategory.name;
    h1Title = `${catName} ${brand.name} en Algérie`;
    pageTitle = `${catName} ${brand.name} en Algérie | Prix & Achat | ZORANDO`;
    metaDescription = `Découvrez la gamme de ${catName.toLowerCase()} ${brand.name} disponibles chez ZORANDO. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.`;
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6 space-y-4">
        <p>Vous recherchez un(e) {catName.toLowerCase()} {brand.name} en Algérie ? ZORANDO vous propose une sélection de {catName.toLowerCase()} {brand.name} adaptées à différents besoins et budgets. Retrouvez des modèles variés et performants selon vos attentes.</p>
        <p>Comparez facilement les {catName.toLowerCase()} {brand.name} disponibles : capacité, puissance, fonctionnalités et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
        <p>Commandez votre {catName.toLowerCase()} {brand.name} en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
      </div>
    );
    bottomSeoContent = (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Quel(le) {catName.toLowerCase()} {brand.name} choisir ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Le choix dépend avant tout de votre utilisation quotidienne. Pour une utilisation familiale, une grande capacité sera idéale. Si vous avez peu de place ou une utilisation individuelle, des capacités plus réduites sont très pratiques.</p>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Les {catName.toLowerCase()} {brand.name} disponibles chez ZORANDO</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre capacité, puissance, et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle. Vous pouvez consulter nos <Link to={`/brands/${brand.slug}`} className="text-orange-500 font-medium hover:underline">autres produits {brand.name}</Link> pour équiper votre cuisine.</p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">FAQ – {catName} {brand.name}</h2>
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold text-gray-800">Quel(le) {catName.toLowerCase()} {brand.name} choisir pour une famille ?</h3>
            <p className="text-gray-700 text-sm mt-1">Pour une utilisation familiale, un(e) {catName.toLowerCase()} {brand.name} de grande capacité offre une solution adaptée pour répondre aux besoins de plusieurs personnes.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quel est le prix d'un(e) {catName.toLowerCase()} {brand.name} en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Le prix dépend du modèle, de sa capacité, de sa puissance et de ses fonctionnalités. ZORANDO affiche le prix actuel directement sur chaque fiche produit afin de permettre de comparer les modèles {brand.name} disponibles.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Les {catName.toLowerCase()} {brand.name} sont-ils/elles disponibles avec livraison en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Oui. Les {catName.toLowerCase()} {brand.name} disponibles sur ZORANDO peuvent être commandées en ligne avec livraison dans les 58 wilayas d'Algérie et paiement à la livraison, selon les conditions affichées sur la fiche du produit.</p>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Pourquoi acheter un(e) {catName.toLowerCase()} {brand.name} chez ZORANDO ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>ZORANDO vous permet de comparer plusieurs modèles de {catName.toLowerCase()} {brand.name} selon leur capacité, leur puissance, leur design et leurs fonctionnalités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
        </div>
      </div>
    );
  } else if (brand.slug === 'electromenager-robuste-algerie') {
    h1Title = brand.h1_title || 'Électroménager ROBUSTE en Algérie – Cafetières, Air Fryers, Pétrins & Maison';
    pageTitle = brand.seo_title || 'Électroménager ROBUSTE Algérie : Cafetières, Air Fryers, Pétrins & Prix DZD';
    metaDescription = brand.seo_description || 'Achetez vos appareils ROBUSTE en Algérie chez ZORANDO : cafetières, air fryers, robots pétrins & défroisseurs. Meilleurs prix et livraison 58 wilayas.';
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6">
        <p>
          Retrouvez toute la gamme officielle <strong>ROBUSTE en Algérie</strong> au meilleur prix sur ZORANDO. 
          Des <strong>cafetières expresso</strong> haute pression aux <strong>air fryers sans huile</strong> grande capacité, 
          en passant par le puissant <strong>robot pétrin PRO MAX</strong> et les <strong>défroisseurs vapeur</strong>, 
          bénéficiez d'appareils fiables avec garantie et livraison rapide dans les 58 wilayas.
        </p>
      </div>
    );

const ROBUSTE_BLOGS = [
  {
    title: "Robot Pétrin ROBUSTE : Idéal pour Kesra, Khobz Dar et Pâtes Lourdes ? (Test 2026)",
    slug: "robot-petrin-robuste-algerie-kesra-khobz-dar-test-avis-prix-2026",
    excerpt: "Le modèle PRO MAX résiste-t-il au pétrissage de la semoule compacte ? Analyse du moteur, transmission et avis pour les recettes algériennes.",
    badge: "FAQ : Pain & Kesra",
    image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-13-1781268258569-9cr8i.webp"
  },
  {
    title: "Nettoyeur de Taches ROBUSTE Proclean 4-en-1 : Test sur Canapés, Tapis & Matelas",
    slug: "nettoyeur-de-taches-robuste-proclean-4en1-algerie-test-avis-prix-2026",
    excerpt: "Détache-t-il en profondeur les salons algériens et sièges auto ? Découverte du cycle 4en1 vapeur 1650W, injection et extraction.",
    badge: "FAQ : Taches & Salons",
    image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-446-1781268420974-wombji.webp"
  },
  {
    title: "Électroménager ROBUSTE en Algérie 2026 : Prix en DZD, Garantie & Avis Clients",
    slug: "electromenager-robuste-algerie-guide-prix-dzd-garantie-avis-2026",
    excerpt: "Grille officielle des tarifs en Algérie, conseils pour reconnaître l'original et sélection des meilleurs appareils indispensables.",
    badge: "FAQ : Prix & Garantie",
    image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/friteuse-sans-huile-robuste-af10-10l-2850w-tactile-avec-fenetre-1-a5h7zj.webp"
  },
  {
    title: "Air Fryer ROBUSTE : Comparatif AF10 10L vs 8L (Avis, Test & Prix DZD)",
    slug: "air-fryer-robuste-algerie-comparatif-af10-10l-8l-avis-prix-2026",
    excerpt: "Quelle friteuse sans huile choisir pour une cuisson saine en Algérie ? Test du modèle XXL AF10 10L à double résistance.",
    badge: "Test Friteuse Sans Huile",
    image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-447-1781268441985-buy8au.webp"
  },
  {
    title: "Machine à Café ROBUSTE : Expresso Roma vs Auto Italia (Guide & Prix 2026)",
    slug: "machine-a-cafe-robuste-algerie-expresso-roma-auto-italia-avis-prix-2026",
    excerpt: "Percolateur 15 bars ou machine à capsules ? Tout savoir pour préparer un café italien crémeux à la maison.",
    badge: "Guide Expresso & Café",
    image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-480-1781268288522-oubtbt.webp"
  }
];

    bottomSeoContent = (
      <div className="mt-12 space-y-8">
        {brand.seo_content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 prose prose-slate max-w-none text-gray-700 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
          </div>
        )}

        {/* Guides & Réponses aux questions fréquentes (Blog) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-500" />
                Guides d'Achat, Tests & Réponses aux Questions Fréquentes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Articles détaillés et tests en conditions réelles pour bien choisir vos appareils ROBUSTE en Algérie.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
            >
              Voir tout le blog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROBUSTE_BLOGS.map((item, idx) => (
              <Link
                key={idx}
                to={`/blog/${item.slug}`}
                className="group flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-video w-full bg-white overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span>Lire l'article complet</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❓</span> Foire Aux Questions – Marque ROBUSTE en Algérie
          </h2>
          <div className="space-y-4">
            {ROBUSTE_FAQ.map((item, idx) => (
              <details key={idx} className="group border border-gray-200 rounded-xl p-4 transition-colors hover:border-orange-200 bg-gray-50/50 open:bg-white" open={idx === 0}>
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center select-none">
                  <span>{item.q}</span>
                  <span className="text-orange-500 font-bold text-xl ml-2 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (brand.slug === 'electromenager-sonashi-algerie') {
    h1Title = brand.h1_title || 'Électroménager SONASHI en Algérie – Tout le Catalogue au Meilleur Prix';
    pageTitle = brand.seo_title || 'Électroménager SONASHI Algérie : Prix, Catalogue & Garantie | ZORANDO';
    metaDescription = brand.seo_description || 'Achetez vos appareils électroménagers SONASHI en Algérie chez ZORANDO. Air fryers double bac verre, machines à café 20 bars, cocottes minute inox. Livraison 58 wilayas.';
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6">
        <p>
          Découvrez la gamme officielle <strong>SONASHI en Algérie</strong> au meilleur rapport qualité-prix sur ZORANDO. 
          Des <strong>Air Fryers innovants à double bac en verre</strong> (SAF-642G) aux <strong>machines à café expresso 3-en-1</strong> (SCM-4984), 
          en passant par les célèbres <strong>cocottes minute inox</strong> tous feux et <strong>aspirateurs cuve inox 30L</strong>, 
          profitez d'équipements fiables, performants et garantis avec livraison express dans les 58 wilayas.
        </p>
      </div>
    );

    const SONASHI_BLOGS = [
      {
        title: "Air Fryer Sonashi SAF-642G (Double Bac Verre 10,2L) : Avis, Test & Prix en Algérie (2026)",
        slug: "air-fryer-sonashi-saf-642g-double-bac-verre-avis-test-prix-algerie-2026",
        excerpt: "Double bac en verre trempé 6L + 4,2L, 1600W : que vaut le nouveau modèle Sonashi pour des frites et viandes dorées sans huile ? Test et avis.",
        badge: "Test Airfryer Verre",
        image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/airfryer-sonashi-saf-642g-1600w-4-en-1-double-bac-6l-42l-en-verre-1-msn6b.webp"
      },
      {
        title: "Machine à Café Expresso Sonashi SCM-4984 (3 en 1, 20 Bars) : Test, Compatibilité & Prix (2026)",
        slug: "machine-a-cafe-sonashi-scm-4984-3en1-multi-capsules-test-avis-prix-algerie-2026",
        excerpt: "20 Bars de pression, adaptateurs Nespresso, Dolce Gusto et café moulu : est-ce la machine expresso la plus rentable d'Algérie ? Notre test complet.",
        badge: "Machine Café 20 Bars",
        image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/machine-a-cafe-expresso-sonashi-scm-4984-3-en-1-20-bars-1400w-multi-capsules-1-hmk3n.webp"
      },
      {
        title: "Électroménager SONASHI en Algérie : Origine, Fiabilité, Catalogue Prix DZD & Avis (2026)",
        slug: "electromenager-sonashi-algerie-origine-fiabilite-catalogue-prix-dzd-avis-2026",
        excerpt: "D'où vient Sonashi ? Est-ce une marque fiable ? Grille officielle des prix en Dinars (DZD), garantie et sélection des meilleurs appareils chez ZORANDO.",
        badge: "Guide & Prix Sonashi 2026",
        image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-455-1781268269465-27gom.webp"
      },
      {
        title: "Robot Pétrin Sonashi 12L 2000W en Algérie : Avis, Test et Meilleur Prix 2026",
        slug: "robot-petrin-sonashi-12l-2000w-algerie-avis-test-prix-2026",
        excerpt: "Besoin d'un robot pétrin puissant pour le pain, le matlouh ou la pâtisserie ? Test complet du robot pétrin Sonashi 2000W 12L avec écran LCD.",
        badge: "Test Pétrin 12L 2000W",
        image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-216-1781268381531-bp8atm.webp"
      },
      {
        title: "Air Fryer Sonashi en Algérie 2026 : Comparatif, Avis et Meilleurs Prix Sans Huile",
        slug: "air-fryer-sonashi-algerie-comparatif-avis-prix-2026",
        excerpt: "Comparatif complet des modèles SAF-110, SAF-115 et SAF-920 : puissance, capacité, double bac et prix en Algérie chez ZORANDO.",
        badge: "Comparatif Air Fryers",
        image: "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/products/prod-222-1781268381857-y173xo.webp"
      }
    ];

    bottomSeoContent = (
      <div className="mt-12 space-y-8">
        {brand.seo_content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 prose prose-slate max-w-none text-gray-700 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
          </div>
        )}

        {/* Guides & Réponses aux questions fréquentes (Blog) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-500" />
                Guides d'Achat, Tests & Réponses aux Questions Fréquentes SONASHI
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Articles comparatifs, fiches techniques et réponses détaillées pour choisir vos appareils SONASHI en Algérie.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
            >
              Voir tout le blog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SONASHI_BLOGS.map((item, idx) => (
              <Link
                key={idx}
                to={`/blog/${item.slug}`}
                className="group flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-video w-full bg-white overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span>Lire l'article complet</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❓</span> Foire Aux Questions – Marque SONASHI en Algérie
          </h2>
          <div className="space-y-4">
            {SONASHI_FAQ.map((item, idx) => (
              <details key={idx} className="group border border-gray-200 rounded-xl p-4 transition-colors hover:border-orange-200 bg-gray-50/50 open:bg-white" open={idx === 0}>
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center select-none">
                  <span>{item.q}</span>
                  <span className="text-orange-500 font-bold text-xl ml-2 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    h1Title = brand.h1_title || `${brand.name} Algérie – Tous les produits ${brand.name}`;
    pageTitle = brand.seo_title || `${brand.name} Algérie – Catalogue de produits | Zorando`;
    metaDescription = brand.seo_description || brand.description || `Découvrez tous les produits de la marque ${brand.name} disponibles en Algérie sur Zorando. Le meilleur catalogue au meilleur prix.`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de produits <strong>{brand.name} Algérie</strong> sur Zorando. 
          Nous proposons une gamme complète de <strong>produits {brand.name}</strong>, 
          reconnus pour leur qualité et leur fiabilité. 
          Parcourez ci-dessous toutes les <strong>catégories {brand.name}</strong> disponibles 
          pour faciliter votre quotidien. Achetez en ligne vos produits {brand.name} en toute sécurité en Algérie.
        </p>
      </div>
    );
  }

  let schemaData: any[] = [];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.zorando.com/" },
      { "@type": "ListItem", "position": 2, "name": "Marques", "item": "https://www.zorando.com/brands" },
      { "@type": "ListItem", "position": 3, "name": brand.name, "item": `https://www.zorando.com/brands/${brand.slug}` },
      ...(isCategoryPage && currentCategory ? [{ "@type": "ListItem", "position": 4, "name": currentCategory.name, "item": `https://www.zorando.com/brands/${brand.slug}/${categorySlug}` }] : [])
    ]
  };
  schemaData.push(breadcrumbSchema);

  if (!isCategoryPage) {
    schemaData.push({
      "@context": "https://schema.org",
      "@type": "Brand",
      "name": brand.name,
      "url": `https://www.zorando.com/brands/${brand.slug}`,
      "logo": brand.image || undefined
    });

    if (brand.slug === 'electromenager-robuste-algerie') {
      schemaData.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": ROBUSTE_FAQ.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      });
    } else if (brand.slug === 'electromenager-sonashi-algerie') {
      schemaData.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": SONASHI_FAQ.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
        schema={schemaData.length > 0 ? schemaData : undefined}
      />
      
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <ChevronRight size={14} />
        <Link to="/brands" className="hover:text-orange-500">Marques</Link>
        <ChevronRight size={14} />
        {isCategoryPage ? (
          <>
            <Link to={`/brands/${brand.slug}`} className="hover:text-orange-500">{brand.name}</Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{currentCategory.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">{brand.name}</span>
        )}
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {brand.image ? (
          <Link to={`/brands/${brand.slug}`} className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 hover:border-orange-200 transition-colors">
            <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-[15px]" />
          </Link>
        ) : (
          <Link to={`/brands/${brand.slug}`} className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 p-[15px] hover:border-orange-200 transition-colors">
            <span className="text-4xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
          </Link>
        )}
        
        <div className="text-left flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{h1Title}</h1>
          
          {/* SEO Natural Text */}
          {seoIntro}

          <div className="mt-2 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
            {displayedProducts.length} produit{displayedProducts.length !== 1 ? 's' : ''} {isCategoryPage ? 'dans cette catégorie' : 'au total'}
          </div>
        </div>
      </div>

      {/* Dynamic Brand Categories Section (Only on main brand page) */}
      {!isCategoryPage && brandCategories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories {brand.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandCategories.map(cat => (
              <div key={`${cat.level}-${cat.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{cat.name} {brand.name} Algérie</h3>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  Découvrez la gamme de {cat.name.toLowerCase()} {brand.name} disponible en Algérie.
                </p>
                <Link 
                  to={`/brands/${brand.slug}/${cat.slug}`}
                  className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Voir les {cat.name.toLowerCase()} {brand.name}
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Area */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isCategoryPage ? `Tous les produits ${currentCategory.name} ${brand.name}` : `Tous les produits ${brand.name}`}
            </h2>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 mb-6">Il n'y a pas de produits disponibles dans cette catégorie pour le moment.</p>
              <Link to={`/brands/${brand.slug}`} className="text-orange-500 hover:text-orange-600 font-medium">
                Voir tous les produits {brand.name}
              </Link>
            </div>
          )}
        </div>

        {/* Existing SEO Sidebar Content (fallback if brand has custom HTML) */}
        {!isCategoryPage && brand.seo_content && brand.slug !== 'electromenager-robuste-algerie' && (
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 seo-description sticky top-24">
              <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
            </div>
          </div>
        )}
      </div>
      {bottomSeoContent}
    </div>
  );
}
