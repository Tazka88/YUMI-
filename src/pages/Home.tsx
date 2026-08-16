import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ChevronRight, ChevronLeft, Truck, ShieldCheck, RefreshCcw, Headset, Users, Moon, Map, Mountain, TreePine, Sun, BookOpen, Pencil, Ruler, Backpack, Apple, Tag, Percent, ArrowDown, ShoppingBag, Umbrella, Waves, Flame, Shirt, Sparkles, Smartphone, Refrigerator, Sofa, Laptop, Dumbbell, Gamepad2, Car } from 'lucide-react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { getCategoryWithEmoji, CategoryNameDisplay } from '../components/Layout';
import Slider from '../components/Slider';
import { fetchWithCache } from '../lib/utils';

const THEME_IMAGES: Record<string, string> = {
  ramadan:      "/images/themes/ramadan.jpg",
  aid:          "/images/themes/aid.jpg",
  independance: "/images/themes/independance.jpg",
  yennayer:     "/images/themes/yennayer.jpg",
  mouloud:      "/images/themes/mouloud.jpg",
  rentree:      "/images/themes/rentree.jpg",
  soldes:       "/images/themes/soldes.jpg",
  ete:          "/images/themes/ete.jpg",
  normal:       ""
};

const OVERLAY_COLOR_1 = "rgba(45,27,105,0.60)";
const OVERLAY_COLOR_2 = "rgba(234,88,12,0.60)";
const OVERLAY_INTENSITY = 0.60;

// Options : "ramadan" | "aid" | "independance" | "yennayer" 
//           | "mouloud" | "rentree" | "soldes" | "ete" | "normal"

import { Helmet } from 'react-helmet-async';

const ThemeBackground = ({ activeTheme, themeImages }: { activeTheme: string, themeImages: Record<string, any> }) => {
  if (activeTheme === "normal" || !activeTheme) return null;

  const intensity = themeImages.overlay_intensity !== undefined ? themeImages.overlay_intensity / 100 : OVERLAY_INTENSITY;
  const color1 = OVERLAY_COLOR_1.replace(/[\d.]+\)$/, `${intensity})`);
  const color2 = OVERLAY_COLOR_2.replace(/[\d.]+\)$/, `${intensity})`);

  const themes = {
    ramadan: {
      image: themeImages.theme_image_ramadan || THEME_IMAGES.ramadan,
      banner: "🌙 Ramadan Karim — Offres Spéciales",
      opacity: "opacity-12",
      icons: (
        <>
          <Moon className="absolute top-10 left-10 w-32 h-32" />
          <Star className="absolute top-20 right-20 w-24 h-24" />
          <Moon className="absolute bottom-20 left-1/4 w-40 h-40" />
          <Star className="absolute top-1/3 left-1/3 w-16 h-16" />
          <Star className="absolute bottom-1/3 right-1/4 w-20 h-20" />
        </>
      )
    },
    aid: {
      image: themeImages.theme_image_aid || THEME_IMAGES.aid,
      banner: "عيد مبارك — Aïd Moubarak 🌙",
      opacity: "opacity-12",
      icons: (
        <>
          <Moon className="absolute top-10 right-10 w-32 h-32" />
          <Star className="absolute top-1/4 left-20 w-24 h-24" />
          <Star className="absolute bottom-20 right-1/4 w-40 h-40" />
          <Moon className="absolute bottom-1/3 left-1/4 w-20 h-20" />
        </>
      )
    },
    independance: {
      image: themeImages.theme_image_independance || THEME_IMAGES.independance,
      banner: "🇩🇿 Vive l'Algérie — Offres Fête Nationale",
      opacity: "opacity-15",
      icons: (
        <>
          <Moon className="absolute top-10 left-1/4 w-32 h-32" />
          <Star className="absolute top-10 left-[30%] w-16 h-16" />
          <Map className="absolute bottom-20 right-20 w-48 h-48" />
          <Star className="absolute top-1/2 right-1/4 w-24 h-24" />
        </>
      )
    },
    yennayer: {
      image: themeImages.theme_image_yennayer || THEME_IMAGES.yennayer,
      banner: "ⴰⵙⴳⴳⴰⵙ ⴰⵎⴰⵣⵉⵖ — Bonne Année Amazighe 🌿",
      opacity: "opacity-12",
      icons: (
        <>
          <Mountain className="absolute bottom-10 left-10 w-48 h-48" />
          <TreePine className="absolute top-20 right-20 w-32 h-32" />
          <Sun className="absolute top-10 left-1/3 w-24 h-24" />
          <TreePine className="absolute bottom-1/3 right-1/3 w-20 h-20" />
        </>
      )
    },
    mouloud: {
      image: themeImages.theme_image_mouloud || THEME_IMAGES.mouloud,
      banner: "🌹 Aïd Mouloud — Mois de Lumière",
      opacity: "opacity-12",
      icons: (
        <>
          <Moon className="absolute top-20 left-20 w-32 h-32" />
          <Star className="absolute top-10 right-1/3 w-16 h-16" />
          <Flame className="absolute bottom-20 right-20 w-40 h-40" />
          <Star className="absolute bottom-1/3 left-1/4 w-24 h-24" />
        </>
      )
    },
    rentree: {
      image: themeImages.theme_image_rentree || THEME_IMAGES.rentree,
      banner: "🎒 Rentrée Scolaire — Tout pour la classe !",
      opacity: "opacity-12",
      icons: (
        <>
          <Backpack className="absolute top-10 left-10 w-32 h-32" />
          <Pencil className="absolute top-1/4 right-20 w-24 h-24" />
          <BookOpen className="absolute bottom-20 left-1/4 w-40 h-40" />
          <Ruler className="absolute top-1/2 left-1/3 w-20 h-20" />
          <Apple className="absolute bottom-1/3 right-1/4 w-24 h-24" />
        </>
      )
    },
    soldes: {
      image: themeImages.theme_image_soldes || THEME_IMAGES.soldes,
      banner: "🔥 Soldes — Jusqu'à -70% sur tout !",
      opacity: "opacity-12",
      icons: (
        <>
          <Percent className="absolute top-10 left-10 w-32 h-32" />
          <Tag className="absolute top-1/4 right-20 w-24 h-24" />
          <ShoppingBag className="absolute bottom-20 left-1/4 w-40 h-40" />
          <ArrowDown className="absolute top-1/2 left-1/3 w-20 h-20" />
          <Percent className="absolute bottom-1/3 right-1/4 w-24 h-24" />
        </>
      )
    },
    ete: {
      image: themeImages.theme_image_ete || THEME_IMAGES.ete,
      banner: "☀️ Été Algérien — Profitez de la saison !",
      opacity: "opacity-12",
      icons: (
        <>
          <Sun className="absolute top-10 right-10 w-32 h-32" />
          <Umbrella className="absolute top-1/4 left-20 w-24 h-24" />
          <Waves className="absolute bottom-20 right-1/4 w-40 h-40" />
          <Sun className="absolute bottom-1/3 left-1/4 w-20 h-20" />
        </>
      )
    }
  };

  const theme = themes[activeTheme as keyof typeof themes];
  if (!theme) return null;

  return (
    <>
      {theme.image && (
        <Helmet>
          <link rel="preload" as="image" href={theme.image} />
        </Helmet>
      )}
      <style>{`
        .min-h-screen.bg-gray-50 {
          background-color: transparent !important;
        }
        .theme-bg {
          background-image: ${theme.image ? `linear-gradient(to bottom, ${color1}, ${color2}), url('${theme.image}')` : `linear-gradient(to bottom, ${color1}, ${color2})`};
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        @media (min-width: 768px) {
          .theme-bg {
            background-position: center;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[-1] theme-bg">
        <div className={`absolute inset-0 text-white ${theme.opacity} overflow-hidden`}>
          {theme.icons}
        </div>
      </div>
      <div className="w-full bg-black/20 text-white text-center py-3 font-bold backdrop-blur-sm shadow-sm text-sm md:text-base">
        {theme.banner}
      </div>
    </>
  );
};

function AnimatedCounter({ target }: { target: number }) {
  return <span>+{target.toLocaleString('fr-FR')}</span>;
}

const FlashSalesHeader = ({ link }: { link?: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 mt-8 bg-gray-900 p-4 rounded-lg shadow-md">
      {/* Left: Title */}
      <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto justify-center sm:justify-start">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-400 text-2xl">⚡</span> Ventes Flash
        </h3>
      </div>

      {/* Center: Countdown */}
      <div className="flex items-center gap-2 mb-3 sm:mb-0">
        <span className="text-gray-300 text-sm font-medium hidden md:inline mr-2">Se termine dans :</span>
        <div className="flex items-center gap-1.5">
          <div className="bg-red-600 text-white font-bold text-lg px-2.5 py-1 rounded shadow-sm min-w-[36px] text-center">{formatNumber(timeLeft.hours)}</div>
          <span className="text-white font-bold text-lg">:</span>
          <div className="bg-red-600 text-white font-bold text-lg px-2.5 py-1 rounded shadow-sm min-w-[36px] text-center">{formatNumber(timeLeft.minutes)}</div>
          <span className="text-white font-bold text-lg">:</span>
          <div className="bg-red-600 text-white font-bold text-lg px-2.5 py-1 rounded shadow-sm min-w-[36px] text-center">{formatNumber(timeLeft.seconds)}</div>
        </div>
      </div>

      {/* Right: Link */}
      {link && (
        <div className="w-full sm:w-auto flex justify-center sm:justify-end">
          <Link to={link} className="text-white hover:text-yellow-400 font-medium text-sm flex items-center transition-colors">
            Voir plus <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, link, children }: { title: string, link?: string, children?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4 mt-8 bg-white p-3 rounded-t-lg border-b-2 border-orange-500">
    <div className="flex items-center">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {children}
    </div>
    {link && (
      <Link to={link} className="text-sm text-orange-500 hover:underline flex items-center">
        Voir tout <ChevronRight size={16} />
      </Link>
    )}
  </div>
);

const getResizedImageUrl = (url: string | null, width: number) => {
  if (!url) return '';
  if (url.startsWith('/api/images/')) {
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
  }
  return url;
};

const MasonryCategoryCard: React.FC<{ cat: any, index: number }> = ({ cat, index }) => {
  let spanClasses = '';
  let aspectClass = '';
  
  // Predictable pattern instead of dynamic loading which causes stuttering
  if (index % 5 === 0) {
    spanClasses = 'col-span-2 row-span-1';
    aspectClass = 'aspect-[16/9]';
  } else if (index % 4 === 0) {
    spanClasses = 'col-span-1 row-span-2';
    aspectClass = 'aspect-[9/16]';
  } else {
    spanClasses = 'col-span-1 row-span-1';
    aspectClass = 'aspect-square';
  }

  return (
    <Link 
      to={`/category/${cat.slug}`} 
      className={`group relative overflow-hidden rounded-2xl bg-gray-50 block ${spanClasses} opacity-100 transition-opacity duration-500`}
    >
      <div className={`w-full h-full relative overflow-hidden bg-white ${aspectClass}`}>
        <img 
          src={getResizedImageUrl(cat.image, index % 5 === 0 ? 800 : 400) || `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random&color=fff&size=400`} 
          alt={cat.name}
          loading={index < 4 ? "eager" : "lazy"}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
        
        <div className="absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center">
          <h3 className={`font-bold text-white tracking-tight leading-tight ${index % 5 === 0 ? 'text-xl md:text-2xl lg:text-3xl' : 'text-base md:text-lg lg:text-xl'}`}>
            {cat.name.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim()}
          </h3>
          <div className="mt-2 sm:mt-3 flex items-center text-white/90 text-xs sm:text-sm font-semibold opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            Découvrir <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Mode & Vêtements": Shirt,
  "Beauté & Santé": Sparkles,
  "Téléphone & Tablette": Smartphone,
  "Électroménager": Refrigerator,
  "Maison, cuisine & bureau": Sofa,
  "Informatique": Laptop,
  "Sports & Loisirs": Dumbbell,
  "Jouets et Jeux": Gamepad2,
  "Accessoire Auto Moto": Car
};

const CategorySidebar = ({ categories }: { categories: any[] }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1024);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Sort categories to match Jumia's order
  const orderedNames = [
    "Mode & Vêtements",
    "Beauté & Santé",
    "Téléphone & Tablette",
    "Électroménager",
    "Maison, cuisine & bureau",
    "Informatique",
    "Sports & Loisirs",
    "Jouets et Jeux",
    "Accessoire Auto Moto"
  ];

  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = orderedNames.indexOf(a.name);
    const indexB = orderedNames.indexOf(b.name);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  if (!isDesktop) return null;

  return (
    <div className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white rounded shadow-[0_2px_5px_rgba(0,0,0,0.1)] py-2 h-[384px] relative z-30">
      {sortedCategories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.name] || Shirt;
        // Strip emoji if it's at the start of the name (some DB entries might have it)
        const cleanName = cat.name.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim();
        
        return (
          <div key={cat.id} className="group static">
            <Link
              to={`/category/${cat.slug}`}
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#f5f5f5] cursor-pointer transition-colors"
            >
              <Icon size={20} className="text-[#757575] shrink-0" />
              <span className="text-[#282828] font-['Roboto',sans-serif] text-[14px] font-normal truncate">
                {cleanName}
              </span>
            </Link>
            
            {/* Mega Menu */}
            {cat.subcategories && cat.subcategories.length > 0 && (
              <div className="absolute left-full top-0 w-[700px] h-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.1)] border-l border-gray-100 hidden group-hover:flex p-6 z-50 overflow-y-auto">
                <div className="columns-3 gap-8 w-full">
                  {cat.subcategories.map((sub: any) => (
                    <div key={sub.id} className="break-inside-avoid mb-6">
                      <Link 
                        to={`/category/${sub.slug}?sub=true`}
                        className="block font-bold text-[#282828] uppercase text-[13px] mb-2 hover:text-[#f68b1e] transition-colors border-b border-gray-200 pb-1"
                      >
                        {sub.name.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim()}
                      </Link>
                      {sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                        <ul className="space-y-1">
                          {sub.sub_subcategories.map((subsub: any) => (
                            <li key={subsub.id}>
                              <Link 
                                to={`/category/${subsub.slug}?subsub=true`}
                                className="block text-[#757575] text-[13px] hover:text-[#f68b1e] transition-colors py-1"
                              >
                                {subsub.name.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim()}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SEOSection = () => (
  <section className="bg-[#f9f9f9] border-t border-gray-200 py-10 font-serif text-sm leading-relaxed text-[#222]">
    <div className="container mx-auto px-4">
      <h2 className="text-xl md:text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-5 text-gray-900">
        Zorando : Votre Boutique en Ligne de Référence pour Acheter en Algérie
      </h2>

      <p className="mb-4">
        Bienvenue sur <strong className="font-bold">Zorando</strong>, la plateforme e-commerce algérienne qui révolutionne votre expérience d'achat en ligne. Zorando, c'est bien plus qu'une simple boutique : c'est une destination complète où acheteurs et vendeurs se retrouvent pour profiter des <strong className="font-bold">meilleurs prix</strong> sur des milliers de produits. Que vous soyez à la recherche d'électronique, de mode, de beauté ou d'articles de maison, Zorando vous garantit une expérience d'achat sûre, rapide et agréable.
      </p>

      <p className="mb-4">
        Sur <strong className="font-bold">Zorando.dz</strong>, trouvez facilement tout ce dont vous avez besoin grâce à notre catalogue soigneusement sélectionné. Comparez les offres, bénéficiez de promotions exclusives et profitez d'une <strong className="font-bold">livraison rapide partout en Algérie</strong>. Notre équipe s'engage à vous offrir une plateforme fiable, avec un service client réactif et des moyens de paiement adaptés à vos besoins.
      </p>

      <h3 className="text-lg font-bold mt-8 mb-3 text-gray-900">
        Un catalogue complet, des prix compétitifs sur toutes les catégories
      </h3>

      <p className="mb-4">
        Chez Zorando, nous proposons une gamme étendue de <strong className="font-bold">produits authentiques et de qualité</strong> pour répondre à toutes vos attentes. Dans la catégorie <strong className="font-bold">électronique</strong>, découvrez les derniers smartphones, laptops, tablettes, casques Bluetooth, écouteurs sans fil et bien d'autres gadgets high-tech. Que vous cherchiez un iPhone, un Samsung Galaxy ou un PC portable de marque, vous trouverez forcément votre bonheur on Zorando.
      </p>

      <p className="mb-4">
        Côté <strong className="font-bold">mode</strong>, explorez notre large collection de vêtements pour homme, femme et enfants : chemises, robes, jeans, baskets, sacs à main et accessoires tendance. Pour les amoureux de la beauté, notre rayon <strong className="font-bold">cosmétiques et soins</strong> regorge de produits de marque à des tarifs imbattables. Enfin, pour votre maison, parcourez notre sélection d'électroménagers, de meubles, de décoration et d'articles de cuisine. Zorando, c'est <strong className="font-bold">tout ce dont vous avez besoin en un seul endroit</strong>.
      </p>

      <h3 className="text-lg font-bold mt-8 mb-3 text-gray-900">
        Les meilleures offres et promotions avec une livraison rapide
      </h3>

      <p className="mb-4">
        Sur Zorando, les bonnes affaires ne s'arrêtent jamais ! Profitez de <strong className="font-bold">promotions quotidiennes</strong>, de ventes flash et de réductions allant jusqu'à -70% sur des centaines d'articles. Inscrivez-vous à notre newsletter pour être le premier informé des offres exclusives et des événements spéciaux comme notre <strong className="font-bold">Grand Sale</strong> ou nos liquidations de fin de saison. De plus, Zorando garantit une <strong className="font-bold">livraison rapide et sécurisée</strong> sur l'ensemble du territoire algérien, avec un suivi en temps réel de vos commandes.
      </p>

      <p className="mb-4">
        Nous travaillons avec des transporteurs de confiance pour vous assurer une expérience de livraison sans stress. Dans certaines wilayas, bénéficiez de la <strong className="font-bold">livraison gratuite</strong> à partir d'un certain montant d'achat — une économie supplémentaire qui fait toute la différence !
      </p>

      <h3 className="text-lg font-bold mt-8 mb-3 text-gray-900">
        Achetez en toute confiance sur Zorando
      </h3>

      <p>
        La sécurité de vos transactions est notre priorité absolue. Sur Zorando, chaque achat est protégé grâce à notre <strong className="font-bold">système de paiement sécurisé</strong> et notre politique de remboursement claire. Vous n'êtes pas satisfait de votre commande ? Notre service client est disponible pour vous accompagner et trouver une solution rapide. Avec des milliers de clients satisfaits et des avis vérifiés, Zorando s'impose comme la référence du shopping en ligne en Algérie. Faites confiance à Zorando pour des <strong className="font-bold">achats malins, sûrs et avantageux</strong> — chaque jour, partout en Algérie.
      </p>
    </div>
  </section>
);

export default function Home() {
  const [activeTheme, setActiveTheme] = useState<string>("normal");
  const [themeImages, setThemeImages] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Product[]>([]);
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);
  const [customProducts, setCustomProducts] = useState<Record<string, Product[]>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [homeSections, setHomeSections] = useState<any[]>([
    { id: 'flash_sales', type: 'flash_sales', title: 'Ventes Flash', isVisible: true },
    { id: 'best_sellers', type: 'best_sellers', title: 'Meilleures Ventes 🏆', isVisible: true },
    { id: 'popular', type: 'popular', title: 'Produits Populaires 🔥', isVisible: true },
    { id: 'new', type: 'new', title: 'Nouveautés 🆕', isVisible: true },
    { id: 'random', type: 'random', title: 'Découverte Aléatoire 🎲', isVisible: true },
  ]);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const handleFetchError = (err: any) => {
      if (err.name !== 'AbortError') console.error(err);
    };

    // Use standard fetch without cache busting to allow caching
    const fetchDynamic = async (url: string) => {
      try {
        // Use fetchWithCache for proper caching
        const res = await fetchWithCache(url, { signal, maxAge: 60000 });
        return res;
      } catch (err: any) {
        if (err.name === 'AbortError') return []; // Silently return empty for aborted requests
        console.error(`Fetch dynamic error for ${url}:`, err);
        return []; // Return empty array to prevent mapping errors
      }
    };

    fetchWithCache('/api/settings', { signal, priority: 'high' } as any).then(data => {
      if ((data as any).active_theme) setActiveTheme((data as any).active_theme);
      setThemeImages(data);
      if ((data as any).home_sections) {
        try {
          const sections = JSON.parse((data as any).home_sections);
          // If random section is missing from saved settings, add it
          if (!sections.find((s: any) => s.type === 'random')) {
            sections.push({ id: 'random', type: 'random', title: 'Découverte Aléatoire 🎲', isVisible: true });
          }
          setHomeSections(sections);
          
          // Fetch products for custom, category, and brand sections
          sections.filter((s: any) => ['custom', 'category', 'brand'].includes(s.type) && s.isVisible).forEach((section: any) => {
            let url = '';
            if (section.type === 'custom' && section.productIds?.length > 0) {
              url = `/api/products?ids=${section.productIds.join(',')}`;
            } else if (section.type === 'category' && section.categoryId) {
              url = `/api/products?category=${section.categoryId}&limit=12`;
            } else if (section.type === 'brand' && section.brandId) {
              url = `/api/products?brand=${section.brandId}&limit=12`;
            }
            if (url) {
              fetchDynamic(url)
                .then(products => {
                  if (Array.isArray(products)) {
                    setCustomProducts(prev => ({ ...prev, [section.id]: products }));
                  }
                })
                .catch(handleFetchError);
            }
          });
        } catch (e) {}
      }
    }).catch(handleFetchError);
    fetchWithCache('/api/categories', { signal, priority: 'high' } as any).then(data => { if (Array.isArray(data)) setCategories(data); }).catch(handleFetchError);
    fetchWithCache('/api/brands', { signal }).then(data => { if (Array.isArray(data)) setBrands(data); setLoadingBrands(false); }).catch(err => { handleFetchError(err); setLoadingBrands(false); });
    
    Promise.all([
      fetchDynamic('/api/products?sort=trending&limit=12').then(data => { if (Array.isArray(data)) setPopularProducts(data); }),
      fetchDynamic('/api/products?sort=top_sales&limit=12').then(data => { if (Array.isArray(data)) setBestSellers(data); }),
      fetchDynamic('/api/products?sort=newest&limit=12').then(data => { if (Array.isArray(data)) setNewProducts(data); })
    ]).catch(handleFetchError).finally(() => {
      setIsInitialLoading(false);
    });
    
    fetchDynamic('/api/products?sort=random&limit=12').then(data => { if (Array.isArray(data)) setRandomProducts(data); }).catch(handleFetchError);
    fetchDynamic('/api/products?promo_active=true&limit=12').then(data => { if (Array.isArray(data)) setPromotions(data); }).catch(handleFetchError);

    const loadSections = () => {
      fetchDynamic('/api/settings')
        .then(data => {
          if ((data as any).home_sections) {
            try {
              const sections = JSON.parse((data as any).home_sections);
              setHomeSections(sections);
              
              sections.filter((s: any) => ['custom', 'category', 'brand'].includes(s.type) && s.isVisible).forEach((section: any) => {
                let url = '';
                if (section.type === 'custom' && section.productIds?.length > 0) {
                  url = `/api/products?ids=${section.productIds.join(',')}`;
                } else if (section.type === 'category' && section.categoryId) {
                  url = `/api/products?category=${section.categoryId}&limit=12`;
                } else if (section.type === 'brand' && section.brandId) {
                  url = `/api/products?brand=${section.brandId}&limit=12`;
                }
                
                if (url) {
                  fetchDynamic(url)
                    .then(products => {
                      if (Array.isArray(products)) {
                        setCustomProducts(prev => ({ ...prev, [section.id]: products }));
                      }
                    })
                    .catch(console.error);
                }
              });
            } catch (e) {}
          }
        })
        .catch(console.error);
    };
    window.addEventListener('zorando_sections_updated', loadSections);
    return () => {
      controller.abort();
      window.removeEventListener('zorando_sections_updated', loadSections);
    };
  }, []);

  const getResizedImageUrl = (url: string | null, width: number) => {
    if (!url) return '';
    if (url.startsWith('/api/images/')) {
      return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
    }
    return url;
  };

  return (
    <>
      <SEO 
        title="Boutique en Ligne Algérie : Achetez au Meilleur Prix" 
        exactTitle={false}
        description="Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Mode, tech, maison et plus à des prix imbattables. Livraison rapide. Commandez vite !" 
        url={window.location.href}
      />
      <ThemeBackground activeTheme={activeTheme} themeImages={themeImages} />
      <div className="container mx-auto px-4 py-6">
        <h1 className="sr-only">
          Votre Shopping en Ligne de Confiance en Algérie
        </h1>
        {/* Hero Section with Sidebar and Carousel */}
        <div className="flex gap-4 lg:h-[384px] mb-6">
          <CategorySidebar categories={categories} />
          <div className="flex-1 min-w-0 h-full">
            <Slider />
          </div>
        </div>

      {/* Trust Badges Section */}
      <div 
        className="flex overflow-x-auto pb-4 lg:grid lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8 snap-x hide-scrollbar animate-fade-in-up"
      >
        {[
          { icon: Truck, title: 'Livraison sur 58 Wilayas', desc: 'Partout en Algérie' },
          { icon: ShieldCheck, title: 'Paiement à la Livraison', desc: '100% Sécurisé' },
          { icon: RefreshCcw, title: 'Retour Facile', desc: 'Sous 7 jours' },
          { icon: Headset, title: 'Support 7j/7', desc: 'À votre écoute' },
          { 
            icon: Users, 
            title: <AnimatedCounter target={10000} />, 
            desc: 'Clients satisfaits',
            stars: true
          },
        ].map((badge, idx) => (
          <div key={idx} className={`min-w-[140px] sm:min-w-0 bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-4 group hover:shadow-md hover:border-[#FF6B00]/30 transition-all duration-300 cursor-default text-center sm:text-left snap-start`}>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center group-hover:bg-[#1a1a2e] group-hover:text-white transition-all duration-300 shrink-0 group-hover:scale-110 transform">
              <badge.icon size={16} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col justify-center h-full">
              <h3 className="font-bold text-[#1a1a2e] text-[10px] sm:text-sm leading-tight group-hover:text-[#FF6B00] transition-colors">{badge.title}</h3>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{badge.desc}</p>
              {badge.stars && (
                <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-0.5 sm:mt-1.5 text-[#FF6B00]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={8} className="sm:w-3 sm:h-3" fill="currentColor" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Categories Section - Premium Design */}
      <div className="mb-10 sm:mb-16 mt-4">
        <div className="flex items-end justify-between mb-6 px-2">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Catégories</h3>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Explorez nos collections</p>
          </div>
          <Link to="/category/all" className="hidden sm:flex items-center text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors">
            Tout voir <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-2 sm:px-0 grid-flow-row-dense">
          {categories.length === 0 ? (
            // Skeleton loader for categories
            [...Array(6)].map((_, i) => {
              return (
                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-square col-span-1 row-span-1"></div>
              );
            })
          ) : (
            categories.map((cat, index) => (
              <MasonryCategoryCard key={cat.id} cat={cat} index={index} />
            ))
          )}
        </div>
      </div>

      {/* Brands Section */}
      {(loadingBrands || brands.length > 0) && (
        <div className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 relative min-h-[150px] sm:min-h-[200px]">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Nos Marques</h3>
            <Link to="/brands" className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1">
              Voir tout <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="overflow-hidden relative w-full py-2">
            {loadingBrands ? (
              <div className="flex gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[140px] h-[100px] sm:w-[180px] sm:h-[120px] shrink-0 rounded-xl bg-gray-200 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4 pr-4" aria-hidden={i > 0 ? "true" : "false"}>
                    {brands.map(brand => (
                      <Link 
                        key={`${i}-${brand.id}`} 
                        to={`/brands/${brand.slug}`} 
                        className="relative w-[140px] h-[100px] sm:w-[180px] sm:h-[120px] shrink-0 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-gray-100 group/brand bg-white block"
                        tabIndex={i > 0 ? -1 : 0}
                      >
                        {brand.image ? (
                          <img 
                            src={brand.image} 
                            alt={brand.name} 
                            width="200"
                            height="120"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain p-4 sm:p-6 group-hover/brand:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover/brand:scale-105 transition-transform duration-500">
                            <span className="font-bold text-4xl">{brand.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/brand:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                          <span className="text-white font-bold text-sm text-center px-2">{brand.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Sections */}
      {isInitialLoading ? (
        <div className="space-y-12 animate-pulse mt-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-10 bg-gray-200 rounded-lg mb-6 w-1/4"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="aspect-[4/5] bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : homeSections.filter(s => s.isVisible).map(section => {
        if (section.type === 'flash_sales' && promotions.length > 0) {
          return (
            <section key={section.id}>
              <FlashSalesHeader link={`/category/all?special_offers=true&title=${encodeURIComponent('Ventes Flash')}`} />
              <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">
                {promotions.slice(0, 10).map((p, i) => (
                  <div key={p.id} className="w-[160px] sm:w-[200px] shrink-0 snap-start md:w-auto">
                    <ProductCard product={p} priority={i < 4} isFlashSale={true} />
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (section.type === 'best_sellers' && bestSellers.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Meilleures Ventes 🏆"} link={`/category/all?sort=top_sales&title=${encodeURIComponent(section.title || 'Meilleures Ventes')}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {bestSellers.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'popular' && popularProducts.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Produits Populaires 🔥"} link={`/category/all?sort=trending&title=${encodeURIComponent(section.title || 'Produits Populaires')}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {popularProducts.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'new' && newProducts.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Nouveautés 🆕"} link={`/category/all?sort=newest&title=${encodeURIComponent(section.title || 'Nouveautés')}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {newProducts.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'random' && randomProducts.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Découverte Aléatoire 🎲"} link={`/category/all?sort=random&title=${encodeURIComponent(section.title || 'Découverte Aléatoire')}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {randomProducts.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (['custom', 'category', 'brand'].includes(section.type)) {
          const sectionProducts = customProducts[section.id] || [];
          if (sectionProducts.length === 0) return null;
          
          let link = "/category/all";
          if (section.type === 'category' && section.categoryId) {
            const cat = categories.find(c => c.id == section.categoryId);
            if (cat) link = `/category/${cat.slug}`;
          } else if (section.type === 'brand' && section.brandId) {
            const brand = brands.find(b => b.id == section.brandId);
            if (brand) link = `/brands/${brand.slug}`;
          } else if (section.type === 'custom' && section.productIds && section.productIds.length > 0) {
            link = `/category/all?ids=${section.productIds.join(',')}&title=${encodeURIComponent(section.title)}`;
          }

          const isCarousel = section.isCarouselOnMobile ?? true;
          return (
            <section key={section.id}>
              <SectionHeader title={`${section.title} ${section.emoji || ''}`} link={link} />
              {isCarousel ? (
                <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4 md:pb-0 px-4 -mx-4 md:px-0 md:mx-0">
                  {sectionProducts.map((p, i) => (
                    <div key={`${section.id}-${p.id}`} className="w-[160px] sm:w-[200px] shrink-0 snap-start md:w-auto">
                      <ProductCard product={p} priority={i < 4} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {sectionProducts.map((p, i) => <ProductCard key={`${section.id}-${p.id}`} product={p} priority={i < 4} />)}
                </div>
              )}
            </section>
          );
        }
        return null;
      })}
      </div>
      <SEOSection />
    </>
  );
}
