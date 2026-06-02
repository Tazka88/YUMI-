import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Star, CheckCircle, ArrowRight, ShieldCheck, Truck, Clock, RotateCcw, ChevronDown, ChevronRight, Play } from 'lucide-react';
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
      setIsScrolled(window.scrollY > window.innerHeight * 0.7);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
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
      stock: 100,
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
  const heroSub = config.hero?.subtitle || "Découvrez l'innovation ultime.";
  
  // Marketing images directly from config or fallback to product images
  const hero_image = config.hero_image || cleanImages[0];
  const lifestyle_image_1 = config.lifestyle_image_1 || cleanImages[1] || hero_image;
  const lifestyle_image_2 = config.lifestyle_image_2 || cleanImages[2] || hero_image;
  const lifestyle_image_3 = config.lifestyle_image_3 || cleanImages[0];
  const before_after_image = config.before_after_image;
  const promo_banner_image = config.promo_banner_image;
  const ugc_video_1 = config.ugc_video_1;
  const ugc_video_2 = config.ugc_video_2;
  const ugc_video_3 = config.ugc_video_3;

  const problem = config.problem || {
    title: "VOTRE QUOTIDIEN, REPENSÉ.",
    description: "Finis les compromis. Découvrez un design conçu pour dépasser vos attentes les plus exigeantes.",
  };

  const solution = config.solution || {
    title: "LA PERFORMANCE À L'ÉTAT PUR.",
    description: "Chaque millimètre, chaque détail a été optimisé pour une expérience sans précédent.",
  };

  const benefits = config.benefits || [
    { title: "Design Premium", desc: "Matériaux haut de gamme pour une robustesse maximale." },
    { title: "Précision", desc: "Des résultats au-delà de vos espérances." },
    { title: "Ergonomie", desc: "Confort absolu lors de chaque utilisation." },
    { title: "Durabilité", desc: "Conçu pour résister à l'épreuve du temps." }
  ];

  const reviews = config.reviews || [
    { name: "Amine K.", text: "C'est exactement ce que je cherchais. La qualité est impressionnante.", rating: 5 },
    { name: "Sarah M.", text: "Livraison rapide et produit conforme. Je recommande vivement !", rating: 5 },
    { name: "Karim D.", text: "Le meilleur investissement de l'année. Une finition impeccable.", rating: 5 }
  ];

  const faqs = config.faq || [
    { q: "Quels sont les délais de livraison ?", a: "Nous livrons partout en Algérie en un temps record (24h à 48h selon la wilaya)." },
    { q: "Puis-je payer à la livraison ?", a: "Oui absolument, vous ne payez que lorsque vous recevez le produit en main propre." },
    { q: "Le produit est-il garanti ?", a: "Oui, tous nos produits bénéficient d'une garantie satisfaction. Signalez-nous tout souci de conformité." }
  ];

  const seoTitle = data.seo_title || `${data.product_name} | Zorando`;
  const seoDescription = data.seo_description || data.product_description?.substring(0, 160) || `Découvrez ${data.product_name} en exclusivité. Haute performance et design premium.`;
  const canonicalUrl = `https://zorando.com/${slug}`;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black pb-0 relative overflow-x-hidden">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {hero_image && <meta property="og:image" content={hero_image} />}
        <meta property="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* 1. HEADER PREMIUM */}
      <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference h-20 flex items-center justify-between px-6 lg:px-12 pointer-events-none">
        <a href="/" className="flex items-center hover:opacity-70 transition-opacity pointer-events-auto" aria-label="ZORANDO">
          <svg width="150" height="28" viewBox="0 0 190 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(2, 2)">
              <path d="M10 10V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
              <rect x="2" y="10" width="24" height="20" rx="4" fill="#fff" fillOpacity="0.1" stroke="#fff" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M9 14.5 H19 L9 24.5 H19" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <text x="38" y="28" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#fff" letterSpacing="-0.02em">ZORANDO</text>
          </svg>
        </a>
      </header>

      {/* 2. HERO FULL SCREEN */}
      <section className="relative h-[100svh] w-full flex flex-col justify-end pb-24 md:pb-32 px-6 lg:px-12">
        <div className="absolute inset-0 z-0">
          {hero_image ? (
            <img src={hero_image} alt="Hero" className="w-full h-full object-cover object-center" />
          ) : (
             <div className="w-full h-full bg-[#111]"></div>
          )}
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
          <h1 className="text-[clamp(3.5rem,10vw,8rem)] font-black text-white leading-[0.85] tracking-tighter uppercase mb-6 drop-shadow-lg">
            {heroTitle}
          </h1>
          <p className="text-xl md:text-3xl text-gray-200 mb-10 max-w-2xl mx-auto font-medium tracking-tight drop-shadow-md">
            {heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={handleBuyNow}
              className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              ACHETER <ArrowRight size={20} className="stroke-[3]" />
            </button>
            <div className="text-white text-3xl font-black drop-shadow-lg tracking-tighter">
              {data.product_promo_price || data.product_price} DA
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST BAR */}
      <section className="bg-[#111] py-8 border-y border-[#333]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-gray-300">
           <div className="flex flex-col items-center gap-3">
             <CheckCircle size={32} className="text-white" strokeWidth={1.5} />
             <span className="text-sm font-bold uppercase tracking-widest">Paiement Livraison</span>
           </div>
           <div className="flex flex-col items-center gap-3">
             <Truck size={32} className="text-white" strokeWidth={1.5} />
             <span className="text-sm font-bold uppercase tracking-widest">Livraison 58 Wilayas</span>
           </div>
           <div className="flex flex-col items-center gap-3">
             <ShieldCheck size={32} className="text-white" strokeWidth={1.5} />
             <span className="text-sm font-bold uppercase tracking-widest">Qualité Supérieure</span>
           </div>
           <div className="flex flex-col items-center gap-3">
             <RotateCcw size={32} className="text-white" strokeWidth={1.5} />
             <span className="text-sm font-bold uppercase tracking-widest">Support Local</span>
           </div>
        </div>
      </section>

      {/* 4. UGC VIDEO SECTION (Dynamic based on config) */}
      {(ugc_video_1 || ugc_video_2) && (
        <section className="py-24 bg-black px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-4xl md:text-5xl font-black tracking-tighter uppercase mb-16">EN ACTION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[ugc_video_1, ugc_video_2, ugc_video_3].filter(Boolean).map((vid, idx) => (
                <div key={idx} className="relative aspect-[9/16] bg-[#1a1a1a] rounded-[2rem] overflow-hidden group cursor-pointer">
                  {/* If it's a direct video link, use video, else assume it might be an image/thumbnail */}
                  {String(vid).match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={vid} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={vid} alt="UGC" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                    {!String(vid).match(/\.(mp4|webm|mov)$/i) && (
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Play fill="white" className="ml-1" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. PROBLEM & SOLUTION BLOCKS */}
      <section className="py-24 md:py-40 bg-white text-black px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-24 md:gap-40">
           {/* Problem */}
           <div className="text-left">
             <h2 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.9] tracking-tighter uppercase mb-8 text-[#111]">
               {problem.title}
             </h2>
             <p className="text-xl md:text-3xl text-gray-600 font-medium max-w-3xl leading-snug">
               {problem.description}
             </p>
           </div>
           
           {/* Solution */}
           <div className="text-right flex flex-col items-end">
             <h2 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.9] tracking-tighter uppercase mb-8 text-[#111]">
               {solution.title}
             </h2>
             <p className="text-xl md:text-3xl text-gray-600 font-medium max-w-3xl leading-snug">
               {solution.description}
             </p>
           </div>
        </div>
      </section>

      {/* 6. LIFESTYLE SECTION 1 */}
      {lifestyle_image_1 && (
        <section className="w-full h-[70vh] md:h-[90vh] relative bg-[#111]">
          <img src={lifestyle_image_1} alt="Lifestyle" className="w-full h-full object-cover opacity-80" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-12 left-6 md:left-12 max-w-2xl">
             <h3 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter shadow-black drop-shadow-xl">SANS LIMITES.</h3>
          </div>
        </section>
      )}

      {/* 7. BÉNÉFICES - GRID */}
      <section className="py-24 md:py-32 bg-black px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333] border border-[#333]">
            {benefits.map((ben: any, idx: number) => (
              <div key={idx} className="bg-black p-10 md:p-16 flex flex-col justify-center min-h-[300px]">
                 <div className="text-white font-black text-4xl md:text-5xl tracking-tighter uppercase mb-6">
                   {ben.title}
                 </div>
                 <p className="text-gray-400 text-lg md:text-2xl font-medium leading-relaxed">
                   {ben.desc}
                 </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. LIFESTYLE SECTION 2 */}
      {lifestyle_image_2 && (
        <section className="w-full relative bg-white py-24 md:py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="aspect-square md:aspect-[21/9] rounded-[2rem] overflow-hidden relative">
              <img src={lifestyle_image_2} alt="Lifestyle 2" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      {/* 9. AVANT / APRÈS (If image provided) */}
      {before_after_image && (
        <section className="py-24 bg-[#111] px-6 text-center">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-12">L'ÉVIDENCE.</h2>
          <div className="max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-[#333]">
             <img src={before_after_image} alt="Avant Après" className="w-full h-auto object-cover" loading="lazy" />
          </div>
        </section>
      )}

      {/* 10. MARKETING GALLERY */}
      {cleanImages.length > 0 && (
        <section className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-12 text-center">
            <h2 className="text-[clamp(3rem,6vw,5rem)] font-black text-black uppercase tracking-tighter leading-none mb-8">
              CONCEPTION IMMERSIVE
            </h2>
            <div className={`grid gap-4 md:gap-6 ${cleanImages.length === 1 ? 'grid-cols-1 text-center' : cleanImages.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {cleanImages.map((img: string, idx: number) => (
                <div key={idx} className="aspect-[4/5] bg-[#f5f5f5] rounded-[1.5rem] overflow-hidden">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>
            {lifestyle_image_3 && (
               <div className="w-full aspect-[21/9] md:aspect-[3/1] rounded-[1.5rem] overflow-hidden mt-6">
                  <img src={lifestyle_image_3} alt="Hero Banner" className="w-full h-full object-cover" loading="lazy" />
               </div>
            )}
          </div>
        </section>
      )}

      {/* PROMO BANNER */}
      {promo_banner_image && (
        <section className="w-full">
           <img src={promo_banner_image} className="w-full h-auto object-cover" alt="Offre Spéciale" />
        </section>
      )}

      {/* 11. REVIEWS PREMIUM */}
      <section className="py-32 bg-black px-6 border-b border-[#222]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-[clamp(3rem,6vw,5rem)] font-black text-white uppercase tracking-tighter mb-20 text-center">
            ILS L'ONT ADOPTÉ
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((rev: any, idx: number) => (
               <div key={idx} className="bg-[#111] p-10 md:p-12 rounded-[2.5rem] flex flex-col h-full border border-[#222] hover:border-[#444] transition-colors">
                 <div className="text-white mb-8 text-2xl tracking-[0.3em]">
                   {"★".repeat(rev.rating || 5)}
                 </div>
                 <p className="text-xl md:text-2xl font-medium mb-12 text-gray-300 leading-snug flex-grow">"{rev.text}"</p>
                 <div>
                   <div className="font-black text-white text-lg uppercase tracking-wide">{rev.name}</div>
                   <div className="text-gray-500 text-sm mt-2 font-bold uppercase tracking-widest flex items-center gap-2">✓ ACHAT VÉRIFIÉ</div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section className="py-32 bg-[#111] px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[clamp(3rem,5vw,4.5rem)] font-black text-white uppercase tracking-tighter mb-16 text-center">
            FAQ
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq: any, idx: number) => (
              <div key={idx} className="bg-black border border-[#333] rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-6 md:p-8 flex justify-between items-center bg-black hover:bg-[#0a0a0a] transition-colors"
                >
                  <span className="font-bold text-lg md:text-xl pr-6">{faq.q}</span>
                  <ChevronDown className={`transform transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 md:p-8 pt-0 text-gray-400 text-base md:text-lg">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. OFFRE & FINAL CTA */}
      <section className="py-32 md:py-48 bg-white text-black px-6 text-center relative overflow-hidden">
        <h2 className="text-[clamp(3.5rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter uppercase mb-10 max-w-5xl mx-auto z-10 relative">
          SÉCURISEZ LE VÔTRE.
        </h2>
        
        <div className="flex flex-col items-center justify-center font-black tracking-tighter z-10 relative mb-12">
           {data.product_promo_price ? (
             <div className="flex flex-col items-center">
               <span className="text-gray-400 line-through text-3xl md:text-4xl">{data.product_price} DA</span>
               <span className="text-[4rem] md:text-[6rem] leading-none">{data.product_promo_price} DA</span>
             </div>
           ) : (
             <span className="text-[4rem] md:text-[6rem] leading-none">{data.product_price} DA</span>
           )}
        </div>

        <button 
          onClick={handleBuyNow}
          className="relative z-10 bg-black text-white px-12 md:px-16 py-6 md:py-8 rounded-full font-black text-xl md:text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl inline-flex items-center gap-3"
        >
          COMMANDER MAINTENANT <ArrowRight size={28} className="stroke-[3]" />
        </button>
      </section>

      {/* 14. PREMIUM FOOTER */}
      <footer className="bg-black text-white pt-20 pb-40 md:pb-20 px-6 border-t border-[#222]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-3xl font-black tracking-tighter">ZORANDO</div>
          <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex gap-6 text-center">
            <span>© {new Date().getFullYear()} Zorando</span>
            <span>All Rights Reserved.</span>
          </div>
        </div>
      </footer>

      {/* 15. STICKY BOTTOM ACTION BAR (Mobile & Desktop) */}
      <div 
        className={`fixed bottom-0 md:bottom-[30px] left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[min(600px,90%)] bg-white border-t md:border border-gray-200 md:rounded-full px-6 py-4 md:py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] md:shadow-2xl flex justify-between items-center z-[100] transition-transform duration-500 will-change-transform ${
          isScrolled ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 flex-1">
          <strong className="text-xl md:text-2xl font-black tracking-tighter text-black leading-none">
            {data.product_promo_price || data.product_price} DA
          </strong>
          {data.product_promo_price && (
            <span className="line-through text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest hidden md:inline-block">
              {data.product_price}
            </span>
          )}
        </div>
        <button 
          onClick={handleBuyNow} 
          className="bg-black hover:bg-gray-900 active:scale-95 transition-transform text-white px-8 md:px-10 py-4 md:py-3 rounded-full font-black text-sm md:text-base whitespace-nowrap uppercase tracking-wider"
        >
          Acheter
        </button>
      </div>
    </div>
  );
}

