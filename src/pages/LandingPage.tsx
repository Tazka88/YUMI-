import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Shield, Truck, Check, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

// Reusable animated section component
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const addToCart = useCartStore(state => state.addItem);
  const observerRef = useRef<HTMLDivElement>(null);

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main CTA is out of view
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
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
    description: data.product_description,
    features: data.features
  };

  const heroImage = config.hero_image || product.image;
  
  const allImages = [
    heroImage,
    ...data.images?.map((img: any) => img.image) || []
  ].filter(Boolean);

  const uniqueImages = Array.from(new Set(allImages)) as string[];

  const galleries = [
    config.lifestyle_image_1,
    config.lifestyle_image_2,
    config.lifestyle_image_3,
    config.lifestyle_image_4,
    config.gallery_image_1,
    config.gallery_image_2,
    config.gallery_image_3
  ].filter(Boolean) as string[];

  const handleBuy = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.promo_price || product.price,
      image: product.image,
      quantity: 1
    });
    navigate('/checkout');
  };

  const discount = product.promo_price ? Math.round(((product.price - product.promo_price) / product.price) * 100) : 0;

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 overflow-x-hidden w-full">
      <Helmet>
        <title>{config.seo_title || `${product.name} - Boutique Officielle`}</title>
        <meta name="description" content={config.seo_description || product.description?.substring(0, 150)} />
      </Helmet>

      {/* HEADER SIMPLE */}
      <header className="w-full bg-white border-b border-gray-100 py-4 px-6 flex justify-center items-center sticky top-0 z-40 shadow-sm relative">
        <div className="w-full max-w-7xl mx-auto flex justify-center lg:justify-start">
			<h1 className="text-xl font-bold uppercase tracking-widest text-black">BOUTIQUE OFFICIELLE</h1>
		</div>
      </header>

      {/* STICKY BUY BAR MOBILE & DESKTOP */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] pb-safe"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="hidden md:flex flex-col">
                <span className="font-bold text-sm truncate max-w-[200px] lg:max-w-xs">{product.name}</span>
                <span className="font-bold text-lg text-black">{product.promo_price || product.price} DA</span>
              </div>
              <button 
                onClick={handleBuy}
                className="w-full md:w-auto flex-1 md:flex-none bg-black text-white px-8 py-4 flex items-center justify-center gap-2 font-bold text-lg rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-wide"
              >
                <ShoppingCart size={20} />
                <span className="md:hidden">Acheter ({product.promo_price || product.price} DA)</span>
                <span className="hidden md:inline">Acheter Maintenant</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto w-full pb-32">
        {/* SECTION PRODUIT PRINCIPALE (Grid Desktop, Stack Mobile) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 p-4 md:p-8 items-start">
          
          {/* GALERIE IMAGES RESPONSIVE */}
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative">
              <img 
                src={uniqueImages[activeImageIndex]} 
                alt={product.name} 
                className="w-full aspect-square object-cover block transition-opacity duration-300"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-lg">
                  -{discount}%
                </div>
              )}
            </div>
            {/* MINIATURES */}
            {uniqueImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2 md:gap-4 w-full">
                {uniqueImages.slice(0, 5).map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={`block w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100 bg-gray-50'}`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover block" style={{ maxWidth: '100%', height: 'auto' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFOS PRODUIT & CTA */}
          <div className="flex flex-col gap-6 w-full lg:sticky lg:top-24">
            
            <div className="flex items-center gap-2 text-sm text-yellow-600 font-bold bg-yellow-50 w-fit px-3 py-1 rounded-full border border-yellow-100">
              <Star size={16} fill="currentColor" />
              <span>4.9/5 Excellent (128+ avis)</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black leading-tight">
              {product.name}
            </h1>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3 relative">
                <span className="text-4xl md:text-5xl font-black">{product.promo_price || product.price} DA</span>
                {product.promo_price && (
                  <span className="text-xl md:text-2xl text-gray-400 line-through font-medium">{product.price} DA</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-100">
              <ul className="space-y-3 px-1">
                <li className="flex items-center gap-3 text-gray-800 font-medium whitespace-normal">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0"><Truck size={18} className="text-green-600" /></div>
                  <span className="flex-1">Livraison 58 Wilayas disponible</span>
                </li>
                <li className="flex items-center gap-3 text-gray-800 font-medium whitespace-normal">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0"><ShieldCheck size={18} className="text-blue-600" /></div>
                  <span className="flex-1">Paiement sécurisé à la livraison</span>
                </li>
              </ul>
            </div>

            <div ref={observerRef} className="w-full mt-2">
              <button 
                onClick={handleBuy}
                className="w-full bg-black text-white px-8 py-5 rounded-2xl font-bold text-xl md:text-2xl hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1 uppercase tracking-wide flex items-center justify-center gap-3"
              >
                <ShoppingCart size={24} />
                COMMANDER MAINTENANT
              </button>
              <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                <Shield size={16} /> Transaction cryptée & 100% sécurisée
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-8 prose prose-gray max-w-none text-gray-600 flex flex-col gap-4">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} className="break-words" />
              ) : (
                <p>Découvrez notre best-seller absolu. Conçu pour allier performance, design et durabilité. Ne manquez pas notre offre spéciale valable aujourd'hui seulement.</p>
              )}
            </div>

            {/* FEATURES LIST */}
            {product.features && product.features.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">Pourquoi le choisir ?</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {product.features.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-800 leading-tight flex-1">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* SECTION AVANTAGES */}
        <section className="p-4 md:p-8 mb-8">
          <div className="bg-black text-white rounded-3xl p-6 md:p-12 w-full flex flex-col md:flex-row gap-8 justify-between items-center text-center md:text-left shadow-xl overflow-hidden">
            <div className="flex-1 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase">Stock Limité.</h2>
              <p className="text-gray-300 text-lg leading-relaxed">En raison d'une forte demande, nos stocks s'écoulent rapidement. Sécurisez votre commande aujourd'hui avant la rupture.</p>
            </div>
            <div className="w-full md:w-auto mt-4 md:mt-0">
               <button 
                onClick={handleBuy}
                className="w-full md:w-auto bg-white text-black px-8 md:px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors uppercase tracking-wide whitespace-nowrap"
              >
                Vérifier la disponibilité
              </button>
            </div>
          </div>
        </section>

        {/* MARKETING IMAGES GALLERY */}
        {galleries.length > 0 && (
          <section className="p-4 md:p-8 w-full flex flex-col gap-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black uppercase">Plus de Détails</h2>
              <div className="w-16 h-1 bg-black mx-auto mt-4" />
            </div>
            
            <div className="flex flex-col gap-4 md:gap-8 w-full block">
              {galleries.map((img, i) => (
                <FadeIn key={i} className="w-full rounded-2xl overflow-hidden bg-gray-100">
                  <img 
                    src={img} 
                    alt={`Marketing overview ${i + 1}`} 
                    className="w-full object-cover block"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
                </FadeIn>
              ))}
            </div>
          </section>
        )}

        {/* AVANT / APRES */}
        {config.before_after_image && (
          <section className="p-4 md:p-8 w-full">
             <div className="text-center mb-6">
              <h2 className="text-3xl font-black uppercase">Résultats</h2>
              <div className="w-16 h-1 bg-black mx-auto mt-4" />
            </div>
            <FadeIn className="w-full rounded-3xl overflow-hidden bg-gray-100 shadow-lg border border-gray-100">
                <img 
                  src={config.before_after_image} 
                  alt="Avant après" 
                  className="w-full object-contain block mx-auto"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                />
            </FadeIn>
          </section>
        )}

        {/* AVIS CLIENTS STATIQUES */}
        <section className="p-4 md:p-8 w-full bg-gray-50 rounded-3xl mb-8 border border-gray-100 shadow-sm mx-auto max-w-[calc(100%-2rem)] md:max-w-none">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black uppercase">Avis Clients</h2>
            <div className="flex items-center justify-center gap-1 mt-4 text-yellow-500">
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
              <Star fill="currentColor" size={24} />
            </div>
            <p className="font-bold text-lg mt-2 text-gray-800">Note moyenne : 4.9/5</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { name: "Amine T.", text: "Super produit, la qualité est incroyable. Livraison très rapide en 2 jours." },
              { name: "Sarah B.", text: "Je suis très satisfaite. Conforme à la description et je recommande fortement ce site." },
              { name: "Karim D.", text: "Excellent rapport qualité/prix. J'avais des doutes mais franchement top ! Merci." }
            ].map((review, i) => (
              <FadeIn key={i} delay={i * 0.1} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 w-full">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 flex-1 leading-relaxed break-words">"{review.text}"</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm text-gray-900">{review.name}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full"><Check size={12} /> Vérifié</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* FAQ ANIMÉE */}
        {(data.faq_q1 || data.faq_q2) && (
          <section className="p-4 md:p-8 w-full max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black uppercase">Questions Fréquentes</h2>
              <div className="w-16 h-1 bg-black mx-auto mt-4" />
            </div>
            <div className="flex flex-col gap-4 w-full">
              {[
                { q: data.faq_q1, a: data.faq_a1 },
                { q: data.faq_q2, a: data.faq_a2 },
                { q: "Comment se passe la livraison ?", a: "Nous livrons dans les 58 wilayas. Vous payez directement à la réception de votre commande." },
                { q: "Quelles sont les garanties ?", a: "Toutes nos commandes bénéficient d'une garantie satisfait ou remboursé sous conditions. Votre satisfaction est notre priorité." }
              ].filter(item => item.q && item.a).map((faq, i) => (
                <FadeIn key={i} delay={i * 0.1} className="w-full">
                  <div className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-gray-50 transition-colors gap-4"
                    >
                      <span className="font-bold text-gray-900 flex-1 break-words leading-snug">{faq.q}</span>
                      <ChevronDown className={`transform transition-transform duration-300 shrink-0 text-gray-400 ${activeFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-5 text-gray-600 overflow-hidden w-full break-words"
                        >
                          <p className="pt-4 border-t border-gray-100 leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* FOOTER PREMIUM */}
      <footer className="w-full bg-gray-50 border-t border-gray-200 py-12 px-6 text-center pb-36">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 w-full">
          <h2 className="text-xl font-bold uppercase tracking-widest text-black mb-4">BOUTIQUE OFFICIELLE</h2>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm font-medium text-gray-500 justify-center flex-wrap">
            <a href="#" className="hover:text-black">Conditions d'utilisation</a>
            <a href="#" className="hover:text-black">Politique de confidentialité</a>
            <a href="#" className="hover:text-black">Mentions Légales</a>
            <a href="#" className="hover:text-black">Contact</a>
          </div>
          <p className="text-gray-400 text-sm mt-8">© 2026. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
