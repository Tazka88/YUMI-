import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Star, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Shield, Truck, Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
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
      } catch (err) {
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
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  const handleBuyNow = () => {
    addToCart({
      id: data.product_id,
      name: data.product_name,
      price: data.product_promo_price || data.product_price,
      stock: 100, // mock stock
      image: data.product_image,
      category_id: 0,
      subcategory_id: null,
      slug: data.product_name,
      description: data.product_description
    } as any, 1);
    navigate('/checkout');
  };

  const imagesList = [data.product_image];
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((img: any) => {
      if (img.image && !imagesList.includes(img.image)) {
        imagesList.push(img.image);
      }
    });
  }
  const cleanImages = imagesList.filter(Boolean);

  const config = data.config || {};
  const heroTitle = config.hero?.title || data.product_name;

  const benefits = config.benefits || [
    { icon: <Shield size={32} />, title: "Qualité Premium", desc: "Tissu respirant anti-UV haute protection" },
    { icon: <Truck size={32} />, title: "Livraison Express", desc: "Partout en Algérie en 48h" },
    { icon: <Star size={32} />, title: "Satisfaction Garantie", desc: "Des milliers de clients satisfaits" }
  ];

  const reviews = config.reviews || [
    { name: "Amine M.", text: "Excellent produit, très bonne qualité. Livraison rapide !", rating: 5 },
    { name: "Sarah K.", text: "Je recommande vivement, exactement comme sur les photos.", rating: 5 },
    { name: "Karim B.", text: "Rapport qualité/prix imbattable. Je commande à nouveau !", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-[#111] text-gray-200 font-sans selection:bg-[#FFB800] selection:text-black">
      <Helmet>
        <title>{data.product_name} | ZORANDO</title>
      </Helmet>

      {/* HEADER FIXE */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent h-20 flex items-center justify-between px-6 lg:px-12">
        <a href="/" className="font-black text-2xl tracking-[0.2em] text-white uppercase" aria-label="ZORANDO Accueil">
          ZORANDO
        </a>
        <button 
          onClick={handleBuyNow} 
          className="bg-transparent border border-gray-800 hover:border-gray-500 text-gray-300 font-medium px-6 py-2 rounded-xl text-sm transition-colors"
        >
          Commander
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="pt-28 pb-16 px-4 md:pt-36 md:pb-24 bg-[#0a0a0a] min-h-[85vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Side */}
          <div className="flex flex-col items-start text-left order-2 lg:order-1 lg:pr-10">
            <div className="bg-[#FFB800] text-black text-[11px] md:text-sm font-bold uppercase tracking-wide px-4 py-1.5 rounded-full mb-8">
              Offre Limitée
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold mb-8 text-white leading-[1.1] tracking-tight">
              {heroTitle}
            </h1>
            
            <div className="mb-10 flex flex-col items-start gap-1">
               {data.product_promo_price ? (
                 <>
                   <span className="text-gray-500 line-through text-xl font-medium">{data.product_price} DA</span>
                   <div className="flex flex-wrap items-baseline gap-3">
                     <span className="text-6xl lg:text-8xl font-black text-[#FFB800] tracking-tighter">{data.product_promo_price}</span>
                     <span className="text-[#FFB800] text-3xl lg:text-4xl font-bold">DA</span>
                     <span className="text-gray-500 text-lg ml-2">/ paire</span>
                   </div>
                 </>
               ) : (
                 <div className="flex items-baseline gap-3">
                   <span className="text-6xl lg:text-8xl font-black text-[#FFB800] tracking-tighter">{data.product_price}</span>
                   <span className="text-[#FFB800] text-3xl lg:text-4xl font-bold">DA</span>
                 </div>
               )}
            </div>
            
            <button 
              onClick={handleBuyNow}
              className="w-full sm:max-w-md bg-[#111] border border-gray-800 hover:border-[#FFB800] text-white font-bold text-lg px-8 py-5 rounded-2xl flex justify-center items-center gap-3 transform active:scale-95 transition-all mb-4 shadow-[0_0_40px_rgba(255,184,0,0.05)]"
            >
              Commander Maintenant
            </button>
            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
              <CheckCircle size={18} className="text-[#FFB800]" />
              Paiement à la livraison
            </div>
          </div>
          
          {/* Image Side */}
          <div className="w-full order-1 lg:order-2">
            <div className="bg-[#111] rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-square flex items-center justify-center border border-gray-800">
              {cleanImages[0] ? (
                 <img src={cleanImages[0]} alt={data.product_name} className="max-w-full max-h-full object-contain p-4" />
              ) : (
                 <div className="text-gray-700 flex flex-col items-center gap-2">
                   <div className="w-12 h-12 border-2 border-gray-700 rounded-md"></div>
                   <span>Photo produit</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERIE */}
      {cleanImages.length > 0 && (
        <section className="w-full bg-[#e5e5e5] flex flex-col items-center py-24 gap-24 px-4">
          {cleanImages.map((src: string, idx: number) => (
            <div key={idx} className="w-full max-w-4xl flex flex-col items-center group">
              <div className="w-full bg-white rounded-3xl overflow-hidden shadow-sm flex items-center justify-center p-4 md:p-8 min-h-[300px]">
                <img 
                  src={src} 
                  alt={`${data.product_name} - Vue ${idx + 1}`} 
                  className="max-w-full max-h-[80vh] object-contain transition-transform duration-700 group-hover:scale-105"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="mt-4 text-gray-400 text-sm uppercase tracking-widest font-medium">
                Image produit {idx + 1} — pleine largeur
              </div>
            </div>
          ))}
        </section>
      )}

      {/* POURQUOI NOUS CHOISIR */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">Pourquoi nous choisir ?</h2>
            <div className="w-16 h-1 bg-[#FFB800] mx-auto mt-6"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((ben: any, idx: number) => (
              <div key={idx} className="bg-[#fafafa] p-12 rounded-[2rem] text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-20 h-20 mx-auto bg-black text-[#FFB800] rounded-full flex items-center justify-center mb-8">
                  {ben.icon ? ben.icon : <Check size={32} />}
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">{ben.title}</h3>
                <p className="text-gray-500 font-medium">{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMANDEZ MAINTENANT */}
      <section className="py-24 bg-[#111] px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Commandez Maintenant</h2>
          </div>
          
          <div className="bg-[#171717] border border-[#2a2a2a] rounded-[2rem] p-8 md:p-14 max-w-lg mx-auto text-center shadow-2xl">
            <div className="mb-10">
              {data.product_promo_price ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-gray-500 line-through text-lg">{data.product_price} DA</span>
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-6xl md:text-7xl font-black text-[#FFB800] tracking-tighter leading-none">{data.product_promo_price}</span>
                    <span className="text-2xl text-[#FFB800] font-bold">DA</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2 justify-center">
                  <span className="text-6xl md:text-7xl font-black text-[#FFB800] tracking-tighter leading-none">{data.product_price}</span>
                  <span className="text-2xl text-[#FFB800] font-bold">DA</span>
                </div>
              )}
            </div>

            <ul className="text-left space-y-5 mb-14 max-w-sm mx-auto">
              <li className="flex items-start gap-4 text-gray-200 font-medium">
                <Check className="text-[#FFB800] flex-shrink-0 mt-0.5" size={20} /> Paiement à la livraison
              </li>
              <li className="flex items-start gap-4 text-gray-200 font-medium">
                <Check className="text-[#FFB800] flex-shrink-0 mt-0.5" size={20} /> Livraison partout en Algérie
              </li>
              <li className="flex items-start gap-4 text-gray-200 font-medium">
                <Check className="text-[#FFB800] flex-shrink-0 mt-0.5" size={20} /> Service client 7j/7
              </li>
              <li className="flex items-start gap-4 text-gray-200 font-medium">
                <Check className="text-[#FFB800] flex-shrink-0 mt-0.5" size={20} /> Retour facile sous 7 jours
              </li>
            </ul>

            <button 
              onClick={handleBuyNow}
              className="w-full bg-[#111] border border-gray-800 hover:border-[#FFB800] hover:bg-[#1a1a1a] text-gray-300 hover:text-white font-bold text-lg px-8 py-5 rounded-2xl transition-all transform active:scale-95"
            >
              Commander Maintenant
            </button>
          </div>
        </div>
      </section>

      {/* CE QU'ILS EN PENSENT */}
      <section className="py-24 bg-white px-4 pb-48">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight">Ce qu'ils en pensent</h2>
            <div className="w-16 h-1 bg-[#FFB800] mx-auto mt-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex text-[#FFB800] mb-6 gap-0.5">
                  {[...Array(rev.rating || 5)].map((_, i) => <Star key={i} size={18} fill="currentColor" className="text-[#FFB800]" />)}
                </div>
                <p className="text-gray-700 italic mb-8 flex-grow leading-relaxed">"{rev.text}"</p>
                <div>
                  <div className="font-bold text-black text-lg mb-1">{rev.name}</div>
                  <div className="text-sm text-green-500 flex items-center gap-1.5 font-medium">
                    <Check size={16} /> Acheteur vérifié
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STICKY BOTTOM BAR */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a] border-t-2 border-[#FFB800] z-[60] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isScrolled ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleBuyNow}
            className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#FFB800] text-gray-300 hover:text-white font-bold text-lg md:text-xl px-4 py-4 rounded-xl flex justify-center items-center transform active:scale-95 transition-all"
          >
            Commander Maintenant — {data.product_promo_price || data.product_price} DA
          </button>
        </div>
      </div>
    </div>
  );
}
