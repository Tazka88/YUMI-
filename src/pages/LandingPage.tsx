import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Star, CheckCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function LandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const res = await fetch(`/api/landing-pages/${slug}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching landing page:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchLandingPage();
  }, [slug, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      // Toggle sticky bar based on scroll distance
      setIsScrolled(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!data) return null;

  const handleBuyNow = () => {
    if (!data) return;
    addToCart({
      id: data.product_id,
      name: data.product_name,
      price: data.product_promo_price || data.product_price,
      stock: 100, // mock stock
      image: data.product_image,
      category_id: 0,
      subcategory_id: null,
      brand_id: null,
      slug: data.slug || '',
      description: data.product_description
    } as any, 1);
    navigate('/checkout');
  };

  const imagesList = [data.product_image];
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((img: any) => {
      if (img.image !== data.product_image) {
        imagesList.push(img.image);
      }
    });
  }
  const cleanImages = imagesList.filter(Boolean);

  const config = data.config || {};
  const heroTitle = config.hero?.title || data.product_name;
  const heroSub = config.hero?.subtitle || "Découvrez l'innovation qui va transformer votre quotidien.";
  
  const problem = config.problem || {
    title: "Marre des solutions qui ne durent pas ?",
    description: "La plupart des produits sur le marché sont fragiles et ne répondent pas à vos attentes.",
  };

  const solution = config.solution || {
    title: "Voici la solution ultime.",
    description: "Nous avons repensé chaque détail pour vous offrir une expérience sans compromis.",
  };

  const benefits = config.benefits || [
    { title: "Design Premium", desc: "Matériaux haut de gamme pour une longévité maximale." },
    { title: "Performance", desc: "Des résultats rapides et fiables à chaque utilisation." },
    { title: "Facilité", desc: "Pensé pour être incroyablement intuitif." }
  ];

  const reviews = config.reviews || [
    { name: "Amine K.", text: "C'est exactement ce que je cherchais. La qualité est impressionnante.", rating: 5 },
    { name: "Sarah M.", text: "Livraison rapide et produit conforme. Je recommande !", rating: 5 },
    { name: "Karim D.", text: "Le meilleur investissement que je fait cette année.", rating: 5 }
  ];

  const faqs = config.faq || [
    { q: "Quels sont les délais de livraison ?", a: "Nous livrons partout en Algérie en un temps record (24h à 48h selon la wilaya)." },
    { q: "Puis-je payer à la livraison ?", a: "Oui absolument, vous ne payez que lorsque vous recevez le produit en main propre." }
  ];

  const seoTitle = data.seo_title || `${data.product_name} | Zorando`;
  const seoDescription = data.seo_description || data.product_description?.substring(0, 160) || `Découvrez ${data.product_name} sur Zorando. La meilleure qualité au meilleur prix avec livraison à domicile.`;
  const canonicalUrl = `https://zorando.com/${slug}`;

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-black selection:text-white pb-0 relative">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {data.product_image && <meta property="og:image" content={data.product_image} />}
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={seoDescription} />
        {data.product_image && <meta property="twitter:image" content={data.product_image} />}

        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* HEADER FIXE */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-8">
        <a href="/" className="flex items-center hover:opacity-90 transition-opacity" aria-label="ZORANDO Accueil">
          <svg width="190" height="36" viewBox="0 0 190 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-7 w-auto">
            <g transform="translate(2, 2)">
              <path d="M10 10V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V10" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
              <rect x="2" y="10" width="24" height="20" rx="4" fill="#111" fillOpacity="0.1" stroke="#111" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M9 14.5 H19 L9 24.5 H19" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <text x="38" y="28" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="28" fontWeight="900" fill="#111" letterSpacing="-0.02em">ZORANDO</text>
          </svg>
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] md:min-h-screen flex items-center px-4 md:px-[8%] bg-black text-white pt-16">
        <div className="absolute inset-0">
           {cleanImages[0] ? (
             <img src={cleanImages[0]} alt="Hero background" className="w-full h-full object-cover opacity-50" />
           ) : (
             <div className="w-full h-full bg-[#111]"></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/40"></div>
        </div>
        <div className="relative z-10 w-full max-w-4xl">
          <div className="inline-block px-5 py-2.5 bg-white/20 border border-white/30 rounded-full mb-8 text-sm md:text-base font-bold tracking-wide backdrop-blur-sm">
            🔥 BEST SELLER ALGÉRIE
          </div>
          <h1 className="text-[clamp(3.5rem,8vw,7.5rem)] font-black mb-6 leading-[0.95] tracking-tighter uppercase whitespace-pre-line text-white shadow-black/50 drop-shadow-xl">
            {heroTitle}
          </h1>
          <p className="text-xl md:text-[1.4rem] text-gray-200 mb-10 max-w-2xl leading-relaxed font-medium drop-shadow-md">
            {heroSub}
          </p>
          <button 
            onClick={handleBuyNow}
            className="bg-white text-black px-10 py-5 rounded-full font-extrabold text-lg transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-3"
          >
            COMMANDER MAINTENANT <ArrowRight size={20} className="stroke-[3]" />
          </button>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 md:py-32 px-4 md:px-[8%] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
          <div className="bg-[#f5f5f5] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] text-center">
             <h3 className="text-3xl md:text-[2.5rem] font-black text-black mb-1 md:mb-2 leading-none">100%</h3>
             <p className="text-gray-600 font-medium text-sm md:text-base">Qualité Garantie</p>
          </div>
          <div className="bg-[#f5f5f5] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] text-center">
             <h3 className="text-3xl md:text-[2.5rem] font-black text-black mb-1 md:mb-2 leading-none">48h</h3>
             <p className="text-gray-600 font-medium text-sm md:text-base">Livraison Rapide</p>
          </div>
          <div className="bg-[#f5f5f5] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] text-center">
             <h3 className="text-3xl md:text-[2.5rem] font-black text-black mb-1 md:mb-2 leading-none">12K+</h3>
             <p className="text-gray-600 font-medium text-sm md:text-base">Clients Satisfaits</p>
          </div>
          <div className="bg-[#f5f5f5] p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] text-center">
             <h3 className="text-3xl md:text-[2.5rem] font-black text-black mb-1 md:mb-2 leading-none">58</h3>
             <p className="text-gray-600 font-medium text-sm md:text-base">Wilayas Livrées</p>
          </div>
        </div>
      </section>

      {/* SPLIT SECTION */}
      <section className="py-10 md:py-20 px-4 md:px-[8%] bg-white">
        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center max-w-7xl mx-auto">
          {cleanImages[0] ? (
            <img src={cleanImages[0]} alt="Vue détaillée" className="w-full rounded-[2rem] object-contain bg-[#f5f5f5] aspect-square p-8 mix-blend-multiply" />
          ) : (
            <div className="w-full rounded-[2rem] bg-[#f5f5f5] aspect-square"></div>
          )}
          <div className="order-first md:order-last">
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black mb-6 md:mb-8 leading-[1.1] uppercase tracking-tighter text-black">
              {problem.title}
            </h2>
            <p className="text-lg md:text-[1.4rem] text-gray-600 leading-relaxed font-medium">
              {problem.description}
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 md:py-32 px-4 md:px-[8%] bg-white text-center">
        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black mb-12 md:mb-20 tracking-tighter uppercase text-black leading-tight max-w-4xl mx-auto">
          POURQUOI LES CHOISIR ?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto text-left">
          {benefits.map((ben: any, idx: number) => (
            <div key={idx} className="bg-[#f7f7f7] p-8 md:p-10 rounded-[1.5rem] md:rounded-[2rem]">
               <h3 className="text-2xl font-black mb-3 text-black">
                 {ben.title}
               </h3>
               <p className="text-gray-600 font-medium text-lg leading-relaxed">{ben.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FULL IMAGE SECTION */}
      {(cleanImages[1] || cleanImages[0]) && (
        <section className="py-10 md:py-20 px-4 md:px-[8%] bg-white">
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black mb-10 md:mb-16 text-center uppercase tracking-tighter text-black max-w-5xl mx-auto leading-tight">
            {solution.title}
          </h2>
          <div className="max-w-7xl mx-auto">
            <img src={cleanImages[1] || cleanImages[0]} className="w-full rounded-[2rem] md:rounded-[3rem] object-contain bg-[#f9f9f9] max-h-[80vh] mix-blend-multiply border border-gray-100" alt="Détail vue principale" />
          </div>
        </section>
      )}

      {/* REVIEWS SECTION */}
      <section className="py-24 md:py-32 px-4 md:px-[8%] bg-[#111] text-white">
        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black mb-16 md:mb-24 text-center uppercase tracking-tighter leading-tight">
          AVIS CLIENTS
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {reviews.map((rev: any, idx: number) => (
             <div key={idx} className="bg-[#1c1c1c] p-8 md:p-10 rounded-[1.5rem] md:rounded-[2rem] flex flex-col h-full">
               <div className="text-yellow-500 mb-8 text-2xl tracking-[0.2em]">
                 {"★".repeat(rev.rating || 5)}
               </div>
               <p className="text-lg md:text-xl font-medium mb-12 text-gray-200 leading-relaxed flex-grow">"{rev.text}"</p>
               <div className="font-bold text-white text-lg">{rev.name}</div>
               <div className="text-gray-500 text-sm mt-1 flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Acheteur vérifié</div>
             </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 md:py-32 px-4 md:px-[8%] bg-white">
        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black mb-12 md:mb-20 text-center uppercase tracking-tighter text-black">
          FAQ
        </h2>
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq: any, idx: number) => (
            <details key={idx} className="bg-[#f5f5f5] p-6 md:p-8 rounded-[1.5rem] group cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
               <summary className="font-bold text-lg md:text-[1.4rem] list-none flex justify-between items-center text-black leading-tight pr-4 relative">
                 {faq.q}
                 <span className="text-3xl text-gray-400 group-open:rotate-45 transition-transform absolute right-0 top-1/2 -translate-y-1/2">+</span>
               </summary>
               <p className="mt-6 text-gray-600 font-medium text-base md:text-lg leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="pt-24 pb-48 md:pb-52 px-4 md:px-[8%] bg-white text-center">
        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black mb-8 uppercase tracking-tighter text-black leading-none mx-auto max-w-5xl">
          PROTÉGEZ-VOUS MAINTENANT.
        </h2>
        <p className="text-lg md:text-[1.4rem] font-medium text-gray-600 mb-12 max-w-2xl mx-auto">
          Offre spéciale aujourd'hui : {data.product_promo_price || data.product_price} DA {data.product_promo_price && <span className="line-through text-gray-400 ml-2">{data.product_price} DA</span>}
        </p>
        <button 
          onClick={handleBuyNow}
          className="bg-[#111] hover:bg-black text-white px-10 md:px-14 py-4 md:py-5 rounded-full font-extrabold text-lg md:text-xl transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-3 shadow-xl shadow-black/20"
        >
          COMMANDER <ArrowRight size={24} className="stroke-[3]" />
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-12 md:py-16 bg-[#111] text-gray-400 text-center font-medium text-sm border-t border-[#222]">
        © Zorando — Livraison dans toute l'Algérie
      </footer>

      {/* STICKY BOTTOM BAR */}
      <div 
        className={`fixed bottom-[15px] left-1/2 -translate-x-1/2 w-[min(900px,92%)] bg-white px-5 py-4 rounded-[60px] shadow-[0_10px_35px_rgba(0,0,0,0.18)] border border-gray-200 flex justify-between items-center z-[60] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isScrolled ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="flex items-center gap-3">
          <strong className="text-[1.3rem] md:text-[1.6rem] font-black tracking-tight text-black leading-none">{data.product_promo_price || data.product_price} DA</strong>
          {data.product_promo_price && (
            <span className="line-through text-gray-400 text-xs md:text-sm font-bold leading-none hidden sm:inline-block">{data.product_price} DA</span>
          )}
        </div>
        <button 
          onClick={handleBuyNow} 
          className="bg-[#111] hover:bg-black text-white px-6 md:px-8 py-3.5 rounded-full font-extrabold text-sm md:text-base whitespace-nowrap active:scale-95 transition-transform"
        >
          ACHETER
        </button>
      </div>
    </div>
  );
}
