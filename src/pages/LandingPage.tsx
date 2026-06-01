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
  const heroTitle = config.hero?.title || data.product_name.split(' ').slice(0,8).join(' ');
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

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white pb-24 md:pb-0 relative">
      <Helmet>
        <title>{data.product_name} | Zorando</title>
      </Helmet>

      {/* HEADER FIXE */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-8">
        <a href="/" className="flex items-center hover:opacity-90 transition-opacity" aria-label="ZORANDO Accueil">
          <svg width="190" height="36" viewBox="0 0 190 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 md:h-8 w-auto">
            <g transform="translate(2, 2)">
              <path d="M10 10V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V10" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="2" y="10" width="24" height="20" rx="4" fill="#f97316" fillOpacity="0.1" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M9 14.5 H19 L9 24.5 H19" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <text x="38" y="28" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="28" fontWeight="900" fill="#111827" letterSpacing="-0.02em"><tspan fill="#f97316" fontSize="36">Z</tspan>ORANDO</text>
          </svg>
        </a>
        <button 
          onClick={handleBuyNow} 
           className="bg-black hover:bg-gray-900 active:scale-95 transition-transform text-white font-bold px-5 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg shadow-black/10"
        >
          Commander
        </button>
      </header>

      {/* HERO SECTION APPLE-STYLE */}
      <section className="pt-32 pb-16 px-4 md:pt-40 md:pb-24 text-center flex flex-col items-center bg-white">
        <div className="inline-flex items-center gap-2 text-red-600 text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-red-100 bg-red-50 mb-8 animate-pulse">
          ⚡ Offre Limitée
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-black">
          {heroTitle}
        </h1>
        <p className="text-lg md:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 font-medium tracking-tight">
          {heroSub}
        </p>
        
        <div className="mb-10 flex flex-col items-center gap-2">
           {data.product_promo_price ? (
             <div className="flex items-end gap-3 justify-center">
               <span className="text-gray-400 line-through text-xl md:text-2xl font-semibold mb-1">{data.product_price} DA</span>
               <span className="text-5xl md:text-6xl font-bold text-black tracking-tight">{data.product_promo_price} DA</span>
             </div>
           ) : (
             <span className="text-5xl md:text-6xl font-bold text-black tracking-tight">{data.product_price} DA</span>
           )}
        </div>

        <button 
          onClick={handleBuyNow}
          className="w-full max-w-sm bg-black hover:bg-gray-900 text-white font-bold text-lg md:text-xl px-8 py-5 rounded-full shadow-2xl shadow-black/20 flex justify-center items-center gap-3 transform active:scale-95 transition-all mb-6"
        >
          Commander Maintenant <ArrowRight size={20} />
        </button>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium">
          <CheckCircle size={16} className="text-green-500" />
          Paiement à la livraison garanti
        </div>
      </section>

      {/* FIRST IMAGE FULL WIDTH */}
      {cleanImages.length > 0 && (
        <section className="w-full bg-white pb-20">
          <div className="max-w-6xl mx-auto px-4 flex justify-center">
            <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 max-w-3xl bg-white w-full">
              <img 
                src={cleanImages[0]} 
                alt={`${data.product_name} - Vue principale`} 
                className="w-full h-auto max-h-[70vh] object-contain transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </section>
      )}

      {/* PROBLEM & SOLUTION SECTION */}
      <section className="py-32 bg-black text-white px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-gray-500">
            {problem.title}
          </h2>
          <p className="text-xl md:text-2xl font-medium text-gray-400 mb-20 max-w-2xl mx-auto leading-relaxed">
            {problem.description}
          </p>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight text-white leading-tight">
            {solution.title}
          </h2>
          <p className="text-xl md:text-3xl font-medium text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {solution.description}
          </p>
        </div>
      </section>

      {/* BENEFITS BENTO GRID */}
      <section className="py-32 bg-[#fafafa] px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((ben: any, idx: number) => (
              <div key={idx} className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                  <Star size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">{ben.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed">{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMMERSIVE GALLERY */}
      {cleanImages.length > 1 && (
        <section className="w-full bg-black flex flex-col py-16 gap-12 items-center px-4">
            {cleanImages.slice(1).map((src: string, idx: number) => (
              <img 
                key={idx} 
                src={src} 
                alt={`${data.product_name} - Galerie ${idx + 2}`} 
                className="w-full max-w-4xl h-auto block m-0 p-0 rounded-[2rem] opacity-95 transition-opacity duration-500 shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-gray-800"
                loading="lazy"
              />
            ))}
        </section>
      )}

      {/* REVIEWS */}
      <section className="py-32 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight text-black">
            L'avis de nos clients
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center text-center p-10 bg-[#fafafa] rounded-[2rem] border border-gray-100">
                <div className="flex text-yellow-400 mb-6">
                  {[...Array(rev.rating || 5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                </div>
                <p className="text-gray-900 font-medium mb-8 text-lg leading-relaxed flex-grow">"{rev.text}"</p>
                <div className="mt-auto">
                  <div className="font-bold text-black">{rev.name}</div>
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mt-2 font-medium">
                    <CheckCircle size={14} className="text-green-500" /> Acheteur vérifié
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 bg-[#fafafa] px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight text-black">
            Questions Fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 flex justify-between items-center text-left"
                >
                  <span className="font-bold text-lg md:text-xl text-black pr-8">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={24} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={24} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-6 text-gray-500 text-lg leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL OFFER SECTION */}
      <section className="py-32 bg-black px-4 relative overflow-hidden">
         {/* Subtle glowing effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[800px] bg-white opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center relative z-10">
           <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">Passez à l'action.</h2>
           <p className="text-xl md:text-2xl text-gray-400 mb-16 font-medium">Ne manquez pas cette opportunité exclusive.</p>
           
           <div className="bg-white/5 backdrop-blur-2xl border border-white/10 w-full p-12 md:p-16 rounded-[3rem] mb-12 shadow-2xl">
              <div className="text-white font-bold text-6xl md:text-7xl tracking-tighter mb-10">
                {data.product_promo_price || data.product_price} <span className="text-2xl md:text-3xl text-gray-400">DA</span>
              </div>
              <ul className="space-y-6 text-left inline-block w-full max-w-sm">
                <li className="flex items-center gap-4 text-white font-medium text-lg">
                  <CheckCircle size={24} className="text-green-400 flex-shrink-0" /> Paiement à la réception
                </li>
                <li className="flex items-center gap-4 text-white font-medium text-lg">
                  <CheckCircle size={24} className="text-green-400 flex-shrink-0" /> Livraison à domicile
                </li>
                <li className="flex items-center gap-4 text-white font-medium text-lg">
                  <CheckCircle size={24} className="text-green-400 flex-shrink-0" /> Qualité supérieure garantie
                </li>
              </ul>
           </div>

           <button 
             onClick={handleBuyNow}
             className="w-full max-w-md bg-white hover:bg-gray-100 text-black font-bold text-xl px-8 py-6 rounded-full shadow-2xl shadow-white/10 flex justify-center items-center gap-3 transform active:scale-95 transition-transform"
           >
             Je Commande Maintenant
           </button>
        </div>
      </section>

      {/* FIXED BOTTOM BUTTON (Mobile & Desktop) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-4 lg:pb-6 z-[60] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isScrolled ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/80 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:shadow-2xl rounded-2xl lg:rounded-full p-2.5 lg:pr-3 lg:pl-6 flex items-center justify-between gap-4">
          
          {/* Desktop Info */}
          <div className="hidden lg:flex items-center gap-4 flex-1 overflow-hidden">
            {cleanImages[0] && (
              <img src={cleanImages[0]} alt="Produit" className="w-14 h-14 rounded-full object-cover border border-gray-100 shadow-sm" />
            )}
            <div className="truncate pr-4">
              <div className="font-bold text-gray-900 truncate">{data.product_name}</div>
              <div className="text-sm font-semibold text-gray-600">
                {data.product_promo_price ? (
                  <span><span className="text-black text-base">{data.product_promo_price} DA</span> <span className="line-through text-gray-400 text-xs ml-1">{data.product_price} DA</span></span>
                ) : (
                  <span className="text-black text-base">{data.product_price} DA</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Info */}
          <div className="lg:hidden flex flex-col pl-2 flex-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total</span>
            <span className="font-black text-xl text-black leading-none">
              {data.product_promo_price || data.product_price} <span className="text-xs font-bold text-gray-500 uppercase">DA</span>
            </span>
          </div>

          <button 
            onClick={handleBuyNow}
            className="flex-[1.5] lg:flex-none lg:w-auto bg-black hover:bg-gray-900 text-white font-bold text-base lg:text-lg px-6 py-3.5 lg:py-3.5 rounded-xl lg:rounded-full shadow-lg flex justify-center items-center gap-2 transform active:scale-95 transition-all whitespace-nowrap"
          >
            Commander <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
