import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ChevronRight, ChevronLeft, Truck, ShieldCheck, RefreshCcw, Headset, Users, Moon, Map, Mountain, TreePine, Sun, BookOpen, Pencil, Ruler, Backpack, Apple, Tag, Percent, ArrowDown, ShoppingBag, Umbrella, Waves, Flame } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { getCategoryWithEmoji, CategoryNameDisplay } from '../components/Layout';
import Slider from '../components/Slider';

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
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = target / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  return <span ref={ref}>+{count.toLocaleString('fr-FR')}</span>;
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
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-yellow-400 text-2xl">⚡</span> Ventes Flash
        </h2>
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
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {children}
    </div>
    {link && (
      <Link to={link} className="text-sm text-orange-500 hover:underline flex items-center">
        Voir tout <ChevronRight size={16} />
      </Link>
    )}
  </div>
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
  const [customProducts, setCustomProducts] = useState<Record<string, Product[]>>({});
  const [homeSections, setHomeSections] = useState<any[]>([
    { id: 'flash_sales', type: 'flash_sales', title: 'Ventes Flash', isVisible: true },
    { id: 'best_sellers', type: 'best_sellers', title: 'Meilleures Ventes 🏆', isVisible: true },
    { id: 'popular', type: 'popular', title: 'Produits Populaires 🔥', isVisible: true },
    { id: 'new', type: 'new', title: 'Nouveautés 🆕', isVisible: true },
  ]);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const handleFetchError = (err: any) => {
      if (err.name !== 'AbortError') console.error(err);
    };

    fetch('/api/settings', { signal, priority: 'high' } as any).then(res => res.json()).then(data => {
      if (data.active_theme) setActiveTheme(data.active_theme);
      setThemeImages(data);
      if (data.home_sections) {
        try {
          const sections = JSON.parse(data.home_sections);
          setHomeSections(sections);
          
          // Fetch products for custom sections
          sections.filter((s: any) => s.type === 'custom' && s.isVisible && s.productIds?.length > 0).forEach((section: any) => {
            fetch(`/api/products?ids=${section.productIds.join(',')}`, { signal })
              .then(res => res.json())
              .then(products => {
                if (Array.isArray(products)) {
                  setCustomProducts(prev => ({ ...prev, [section.id]: products }));
                }
              })
              .catch(handleFetchError);
          });
        } catch (e) {}
      }
    }).catch(handleFetchError);
    fetch('/api/categories', { signal, priority: 'high' } as any).then(res => res.json()).then(data => { if (Array.isArray(data)) setCategories(data); }).catch(handleFetchError);
    fetch('/api/brands', { signal }).then(res => res.json()).then(data => { if (Array.isArray(data)) setBrands(data); setLoadingBrands(false); }).catch(err => { handleFetchError(err); setLoadingBrands(false); });
    fetch('/api/products?popular=true', { signal }).then(res => res.json()).then(data => { if (Array.isArray(data)) setPopularProducts(data); }).catch(handleFetchError);
    fetch('/api/products?best_seller=true', { signal }).then(res => res.json()).then(data => { if (Array.isArray(data)) setBestSellers(data); }).catch(handleFetchError);
    fetch('/api/products?new=true', { signal }).then(res => res.json()).then(data => { if (Array.isArray(data)) setNewProducts(data); }).catch(handleFetchError);
    fetch('/api/products?promotions=true', { signal }).then(res => res.json()).then(data => { if (Array.isArray(data)) setPromotions(data); }).catch(handleFetchError);

    const loadSections = () => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.home_sections) {
            try {
              const sections = JSON.parse(data.home_sections);
              setHomeSections(sections);
              
              sections.filter((s: any) => s.type === 'custom' && s.isVisible && s.productIds?.length > 0).forEach((section: any) => {
                fetch(`/api/products?ids=${section.productIds.join(',')}`)
                  .then(res => res.json())
                  .then(products => {
                    if (Array.isArray(products)) {
                      setCustomProducts(prev => ({ ...prev, [section.id]: products }));
                    }
                  })
                  .catch(console.error);
              });
            } catch (e) {}
          }
        })
        .catch(console.error);
    };
    window.addEventListener('yumi_sections_updated', loadSections);
    return () => {
      controller.abort();
      window.removeEventListener('yumi_sections_updated', loadSections);
    };
  }, []);

  return (
    <>
      <SEO 
        title="Boutique en ligne" 
        description="Yumi - Votre boutique en ligne de confiance. Découvrez nos meilleurs produits, promotions et nouveautés au meilleur prix." 
        url={window.location.href}
      />
      <ThemeBackground activeTheme={activeTheme} themeImages={themeImages} />
      <div className="container mx-auto px-4 py-6">
        {/* Hero Banner Carousel */}
        <Slider />

      {/* Trust Badges Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
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
          <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 group hover:shadow-md hover:border-[#FF6B00]/30 transition-all duration-300 cursor-default text-center sm:text-left ${idx === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center group-hover:bg-[#1a1a2e] group-hover:text-white transition-all duration-300 shrink-0 group-hover:scale-110 transform">
              <badge.icon size={24} />
            </div>
            <div className="flex flex-col justify-center h-full">
              <h3 className="font-bold text-[#1a1a2e] text-sm leading-tight group-hover:text-[#FF6B00] transition-colors">{badge.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{badge.desc}</p>
              {badge.stars && (
                <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-1.5 text-[#FF6B00]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Categories Grid */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm min-h-[200px]">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Catégories Populaires</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.length === 0 ? (
            // Skeleton loader for categories
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square max-w-[160px] rounded-2xl mb-3 bg-gray-200 animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))
          ) : (
            categories.slice(0, 12).map((cat, index) => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="flex flex-col items-center group">
                <div className="w-full aspect-square max-w-[160px] rounded-2xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100 bg-gray-50 flex items-center justify-center">
                  <img 
                    src={cat.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random&color=fff&size=200`} 
                    alt={cat.name}
                    width="200"
                    height="200"
                    loading={index < 6 ? "eager" : "lazy"}
                    fetchPriority={index < 6 ? "high" : "auto"}
                    decoding="async"
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[14px] text-center text-gray-700 group-hover:text-orange-500 font-medium">
                  <CategoryNameDisplay name={cat.name} className="justify-center" />
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Brands Section */}
      {(loadingBrands || brands.length > 0) && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative min-h-[200px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Nos Marques</h2>
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
      {homeSections.filter(s => s.isVisible).map(section => {
        if (section.type === 'flash_sales' && promotions.length > 0) {
          return (
            <section key={section.id}>
              <FlashSalesHeader link="/category/all" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {promotions.slice(0, 5).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'best_sellers' && bestSellers.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Meilleures Ventes 🏆"} link="/category/all" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bestSellers.slice(0, 5).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'popular' && popularProducts.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Produits Populaires 🔥"} link="/category/all" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {popularProducts.slice(0, 10).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'new' && newProducts.length > 0) {
          return (
            <section key={section.id}>
              <SectionHeader title={section.title || "Nouveautés 🆕"} link="/category/all" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {newProducts.slice(0, 5).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        if (section.type === 'custom') {
          const sectionProducts = customProducts[section.id] || [];
          if (sectionProducts.length === 0) return null;
          return (
            <section key={section.id}>
              <SectionHeader title={`${section.title} ${section.emoji || ''}`} link="/category/all" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sectionProducts.map((p, i) => <ProductCard key={`${section.id}-${p.id}`} product={p} priority={i < 4} />)}
              </div>
            </section>
          );
        }
        return null;
      })}
    </div>
    </>
  );
}
