import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Shield, Truck, Clock, Check, ChevronDown, ChevronRight, X, Play } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

// Reusable animated section component
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCart = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/landing-pages/${slug}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center w-full overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!data) return null;

  const config = data.config || {};
  const product = {
    id: data.product_id,
    name: data.product_name,
    price: data.product_price,
    promo_price: data.product_promo_price,
    image: data.product_image,
  };

  // Safe image fallbacks if config images are missing
  const heroImage = config.hero_image || product.image;
  const ls1 = config.lifestyle_image_1 || product.image;
  const ls2 = config.lifestyle_image_2 || heroImage;
  const ls3 = config.lifestyle_image_3 || ls1;
  const ls4 = config.lifestyle_image_4 || ls2;
  const beforeAfter = config.before_after_image;
  const promoBanner = config.promo_banner_image;
  const ugc1 = config.ugc_video_1;
  
  const galleries = [
    config.gallery_image_1,
    config.gallery_image_2,
    config.gallery_image_3,
    config.gallery_image_4,
    config.gallery_image_5
  ].filter(Boolean);

  if (galleries.length === 0) {
    data.images?.slice(0, 5).forEach((img: any) => galleries.push(img.image));
  }

  const handleBuy = () => {
    navigate('/checkout', { 
      state: { 
        directBuyItem: { 
          ...product, 
          quantity: 1, 
          cartItemId: product.id.toString() 
        } 
      } 
    });
  };

  const discount = product.promo_price ? Math.round(((product.price - product.promo_price) / product.price) * 100) : 0;

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 selection:bg-black selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      <Helmet>
        <title>{config.seo_title || `${product.name} - Site Officiel`}</title>
        <meta name="description" content={config.seo_description || data.product_description?.substring(0, 150)} />
      </Helmet>

      {/* STICKY BUY BAR */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-[100vw]"
          >
            <div className="flex items-center gap-4">
              <img src={heroImage} alt={product.name} className="w-12 h-12 object-cover rounded hidden sm:block max-w-full h-auto" />
              <div>
                <h3 className="font-bold text-sm sm:text-base hidden sm:block truncate max-w-[200px] lg:max-w-[400px]">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{product.promo_price || product.price} DA</span>
                  {product.promo_price && <span className="text-gray-400 line-through text-sm">{product.price} DA</span>}
                </div>
              </div>
            </div>
            <button 
              onClick={handleBuy}
              className="bg-black text-white px-4 sm:px-10 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base hover:bg-gray-800 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              Acheter <span className="hidden sm:inline">Maintenant</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-4 left-4 right-4 sm:hidden z-50 max-w-[100vw]"
          >
            <button 
              onClick={handleBuy}
              className="w-full bg-black text-white px-6 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-gray-800 transition-colors uppercase tracking-wide flex items-center justify-center gap-2 max-w-full"
            >
              <ShoppingCart size={20} />
              Acheter ({product.promo_price || product.price} DA)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO PLEIN ECRAN */}
      <section className="relative h-[100svh] w-full max-w-[100vw] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Hero" className="w-full min-h-full object-cover opacity-60 mix-blend-overlay max-w-none md:max-w-full block" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[1.1] md:leading-[0.9] break-words">
              {product.name}
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-2xl text-gray-300 font-light max-w-2xl mx-auto">
              L'excellence redéfinie. Conçu pour ceux qui n'acceptent aucun compromis.
            </p>
            
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full">
              <button onClick={handleBuy} className="w-full sm:w-auto bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition-transform sm:hover:scale-105 uppercase tracking-wide">
                Acheter Maintenant
              </button>
              <div className="flex flex-col items-center sm:items-start text-white">
                <div className="flex items-center gap-2">
                  <span className="text-3xl md:text-3xl font-bold">{product.promo_price || product.price} DA</span>
                  {product.promo_price && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-{discount}%</span>
                  )}
                </div>
                {product.promo_price && <span className="text-gray-400 line-through">{product.price} DA</span>}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. BARRE DE CONFIANCE */}
      <div className="bg-gray-50 border-b border-gray-200 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-full">
            {[
              { icon: Truck, title: "Livraison 58 Wilayas", desc: "Rapide & Sécurisée" },
              { icon: Shield, title: "Paiement à la livraison", desc: "100% Sécurisé" },
              { icon: Star, title: "Garantie Satisfait", desc: "Ou Remboursé" },
              { icon: Clock, title: "Support 24/7", desc: "À votre écoute" }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1} className="flex flex-col items-center text-center p-2">
                <item.icon size={28} strokeWidth={1.5} className="mb-2 md:mb-4 text-gray-800" />
                <h4 className="font-bold text-xs md:text-sm uppercase tracking-wide break-words w-full">{item.title}</h4>
                <p className="text-gray-500 text-xs md:text-sm mt-1">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PROBLEME / SOLUTION (UGC & LIFESTYLE 1) */}
      <section className="py-16 md:py-32 bg-white w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <FadeIn className="w-full">
              <h2 className="text-3xl md:text-6xl font-black tracking-tight uppercase leading-none mb-4 md:mb-6 break-words">
                Le Problème.<br />La Solution.
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-light mb-6 md:mb-8 leading-relaxed">
                Vous avez assez perdu de temps avec des solutions qui ne tiennent pas leurs promesses. Découvrez pourquoi des milliers de clients font confiance à notre expertise. Une conception repensée de A à Z.
              </p>
              <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 w-full">
                {['Design ergonomique supérieur', 'Matériaux premium ultra-résistants', 'Efficacité d\'action immédiate'].map((item, i) => (
                  <li key={i} className="flex items-start md:items-center gap-3 md:gap-4 text-base md:text-lg font-medium text-gray-800">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-0.5 md:mt-0">
                      <Check size={14} className="md:w-4 md:h-4" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.2} className="relative aspect-[4/5] w-full rounded-2xl md:rounded-3xl overflow-hidden bg-gray-100">
               {ugc1 ? (
                <video src={ugc1} autoPlay loop muted playsInline className="w-full h-full object-cover max-w-full block" />
              ) : (
                <img src={ls1} alt="Solution" className="w-full h-full object-cover max-w-full block" />
              )}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 4. LIFESTYLE SECTION FULL WIDTH (Apple Style) */}
      <section className="relative h-[60vh] md:h-[80vh] w-full bg-black overflow-hidden max-w-[100vw]">
        <div className="absolute inset-0">
          <img src={ls2} alt="Immersive view" className="w-full min-h-full object-cover opacity-80 max-w-none md:max-w-full block" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <FadeIn className="absolute bottom-0 left-0 right-0 p-6 md:p-16 text-white text-center md:text-left">
          <h2 className="text-3xl md:text-7xl font-black uppercase tracking-tight mb-2 md:mb-4">Puissance Pure.</h2>
          <p className="text-lg md:text-3xl font-light text-gray-300 max-w-2xl px-4 md:px-0 mx-auto md:mx-0">Une avancée majeure dans votre quotidien.</p>
        </FadeIn>
      </section>

      {/* 5. LIFESTYLE 3 & 4 (Apple Style Features) */}
      <section className="py-16 md:py-24 bg-white w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <FadeIn className="relative h-[400px] md:h-[500px] w-full rounded-2xl md:rounded-3xl overflow-hidden group bg-gray-100">
              <img src={ls3} alt="Feature" className="absolute inset-0 w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-700 max-w-full block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-8 text-white w-full">
                <h3 className="text-2xl md:text-3xl font-bold">Performance Absolue.</h3>
              </div>
            </FadeIn>
            <FadeIn delay={0.2} className="relative h-[400px] md:h-[500px] w-full rounded-2xl md:rounded-3xl overflow-hidden group bg-gray-100">
              <img src={ls4} alt="Feature" className="absolute inset-0 w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-700 max-w-full block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-8 text-white w-full">
                <h3 className="text-2xl md:text-3xl font-bold">Innovation Discrète.</h3>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 6. BENEFITS CARDS (Bento Grid Style) */}
      <section className="py-16 md:py-24 bg-gray-50 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Caractéristiques<br/>Premium</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <FadeIn className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 sm:hover:shadow-xl transition-shadow duration-500 w-full max-w-full">
              <Shield size={36} className="mb-4 md:mb-6 text-black" />
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Conception Robuste</h3>
              <p className="text-gray-600 text-base md:text-lg">Fabriqué avec des matériaux de qualité aérospatiale pour une durabilité extrême. Il est conçu pour durer, quoi qu'il arrive.</p>
            </FadeIn>
            <FadeIn delay={0.1} className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 sm:hover:shadow-xl transition-shadow duration-500 w-full max-w-full">
              <Star size={36} className="mb-4 md:mb-6 text-black" />
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Précision Absolue</h3>
              <p className="text-gray-600 text-base md:text-lg">Chaque détail a été méticuleusement pensé et calibré pour offrir une expérience utilisateur parfaite au millimètre près.</p>
            </FadeIn>
            <FadeIn delay={0.2} className="relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-gray-100 md:col-span-2 group min-h-[300px] md:min-h-[400px] w-full max-w-full">
              <img src={ls3} alt="Feature" className="absolute inset-0 w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-700 max-w-full block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-12 text-white w-full">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Design Sans Précédent.</h3>
                <p className="font-light text-gray-300 text-base md:text-lg max-w-xl">L'élégance se mêle à la performance. Un design minimaliste qui cache une technologie de pointe.</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 10. AVANT / APRES ou DEMO */}
      {beforeAfter && (
        <section className="py-16 md:py-24 bg-white w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8 md:mb-12">La Différence.<br/>Instantanée.</h2>
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[4/3] md:aspect-video w-full max-w-4xl mx-auto bg-gray-100 shadow-2xl">
                <img src={beforeAfter} alt="Avant/Après" className="w-full h-full object-contain md:object-cover max-w-full block" />
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* 12. MARKETING GALLERY */}
      {galleries.length > 0 && (
        <section className="py-16 md:py-24 bg-black text-white w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-black uppercase mb-8 md:mb-16 text-center">Galerie</h2>
            </FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 w-full">
              {galleries.map((img, i) => (
                <FadeIn key={i} delay={i * 0.1} className={`relative overflow-hidden rounded-xl bg-gray-900 group w-full ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover opacity-80 sm:group-hover:opacity-100 sm:group-hover:scale-105 transition-all duration-700 max-w-full block" />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 14. ANIMATED FAQ */}
      {(data.faq_q1 || data.faq_q2) && (
        <section className="py-16 md:py-24 bg-gray-50 w-full overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <FadeIn className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-black uppercase">Questions Fréquentes</h2>
            </FadeIn>
            <div className="space-y-3 md:space-y-4 w-full">
              {[
                { q: data.faq_q1, a: data.faq_a1 },
                { q: data.faq_q2, a: data.faq_a2 },
                { q: "Quels sont les délais de livraison ?", a: "La livraison s'effectue généralement entre 24h et 72h selon votre wilaya." },
                { q: "Puis-je payer à la livraison ?", a: "Absolument. Vous pouvez inspecter le produit avant de payer le livreur en espèces." }
              ].filter(item => item.q && item.a).map((faq, i) => (
                <FadeIn key={i} delay={i * 0.1} className="w-full">
                  <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm w-full">
                    <button 
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full px-4 sm:px-6 py-4 md:py-6 flex justify-between items-center text-left hover:bg-gray-50 transition-colors gap-4"
                    >
                      <span className="font-bold text-base md:text-lg pr-4 md:pr-8">{faq.q}</span>
                      <ChevronDown className={`transform transition-transform duration-300 shrink-0 text-gray-400 ${activeFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 sm:px-6 pb-4 md:pb-6 text-gray-600 text-sm md:text-base break-words"
                        >
                          <p className="pt-2 border-t border-gray-50">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 16. FINAL CTA CTA */}
      <section className="relative py-24 md:py-32 bg-black text-white text-center overflow-hidden w-full max-w-[100vw]">
        {promoBanner && (
           <img src={promoBanner} alt="Promo" className="absolute inset-0 w-full min-h-full object-cover opacity-30 max-w-none md:max-w-full block" />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tight mb-6 md:mb-8 break-words">N'attendez plus.</h2>
            <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 md:mb-12">Le stock est limité. Profitez de l'offre spéciale aujourd'hui.</p>
            <button 
              onClick={handleBuy}
              className="w-full sm:w-auto bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl hover:bg-gray-100 transition-transform sm:hover:scale-105 uppercase tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.3)] max-w-full"
            >
              Commander Maintenant
            </button>
            <p className="mt-6 md:mt-8 text-gray-400 font-medium flex items-center justify-center gap-2 text-sm md:text-base">
              <Shield size={18} /> Paiement 100% sécurisé à la livraison
            </p>
          </FadeIn>
        </div>
      </section>

      {/* 17. PREMIUM FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-10 md:py-12 pb-32 sm:pb-12 text-center text-xs md:text-sm font-medium text-gray-500 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <p>© 2026 Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 max-w-full">
            <a href="#" className="hover:text-black transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-black transition-colors">Conditions Générales</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
