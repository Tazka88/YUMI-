import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Star, CheckCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const res = await fetch(`/api/landing-pages/${slug}`);
        if (res.ok) {
          const lpData = await res.json();
          setData(lpData);
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
      quantity: 1,
      image: data.product_image,
      category_id: 0,
      subcategory_id: null,
      slug: data.product_name,
      description: data.product_description
    });
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

  const reviews = [
    { name: "Yassine B.", text: "Produit authentique et qualité au top. La livraison a été hyper rapide !", rating: 5 },
    { name: "Meriem A.", text: "Très satisfaite de mon achat. Je recommande cette boutique sérieuse.", rating: 5 },
    { name: "Sofiane D.", text: "Super ! Exactement comme sur les photos. Le livreur était très gentil en plus.", rating: 5 }
  ];

  // Truncate product name if too long to make it punchy for the hero
  const words = data.product_name.split(' ');
  const heroName = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 pt-16">
      <Helmet>
        <title>{data.product_name} | Zorando</title>
      </Helmet>

      {/* HEADER FIXE */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-gray-800 h-16 flex items-center justify-between px-4 lg:px-8">
        <div className="font-black text-2xl tracking-tighter text-white uppercase">ZORANDO</div>
        <button 
          onClick={handleBuyNow} 
          className="bg-yellow-500 hover:bg-yellow-400 active:scale-95 transition-transform text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 uppercase tracking-wide shadow-md"
        >
          Commander
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="px-4 py-8 md:py-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-[10px] md:text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 animate-pulse">
          ⚡ Offre Limitée
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight max-w-3xl mx-auto uppercase">
          {heroName}
        </h1>
        
        <div className="mb-8 flex flex-col items-center gap-1">
           {data.product_promo_price ? (
             <>
               <span className="text-gray-500 line-through text-lg md:text-xl font-medium">{data.product_price} DA</span>
               <span className="text-5xl md:text-6xl font-black text-yellow-500 drop-shadow-md">{data.product_promo_price} DA</span>
             </>
           ) : (
             <span className="text-5xl md:text-6xl font-black text-yellow-500 drop-shadow-md">{data.product_price} DA</span>
           )}
        </div>

        <button 
          onClick={handleBuyNow}
          className="w-full max-w-sm bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-8 py-5 rounded-xl uppercase tracking-wider mb-4 shadow-[0_0_30px_rgba(234,179,8,0.5)] flex justify-center items-center gap-3 transform active:scale-95 transition-transform"
        >
          <ShoppingCart size={28} />
          Commander Maintenant
        </button>
        <div className="flex items-center justify-center gap-2 text-gray-300 text-sm font-bold bg-white/5 py-2 px-4 rounded-full">
          <CheckCircle size={18} className="text-green-500" />
          Paiement à la livraison
        </div>
      </section>

      {/* FULL WIDTH IMAGES */}
      <section className="w-full bg-black max-w-3xl mx-auto flex flex-col">
          {cleanImages.map((src: string, idx: number) => (
            <img 
              key={idx} 
              src={src} 
              alt={`${data.product_name} - Vue ${idx + 1}`} 
              className="w-full h-auto block m-0 p-0"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))}
      </section>

      {/* REVIEWS */}
      <section className="py-16 bg-white text-black px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10 uppercase tracking-tight text-gray-900">Avis Clients</h2>
          <div className="flex flex-col gap-6">
            {reviews.map((rev, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(rev.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-gray-800 font-medium mb-4 text-base leading-relaxed">"{rev.text}"</p>
                <div className="flex justify-between items-end border-t border-gray-200 pt-3">
                  <div className="font-bold text-gray-900 text-lg">{rev.name}</div>
                  <div className="text-xs text-green-600 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                    <CheckCircle size={14} strokeWidth={3} /> Acheteur vérifié
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL PRICE & BENEFITS */}
      <section className="py-16 bg-black px-4 border-t border-gray-800">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
           <h2 className="text-3xl font-black mb-8 uppercase text-white tracking-tight">Récapitulatif de l'offre</h2>
           
           <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full p-8 rounded-3xl mb-8 border border-gray-700 shadow-2xl">
              <div className="text-yellow-500 font-black text-5xl mb-8 filter drop-shadow-md">
                {data.product_promo_price || data.product_price} DA
              </div>
              <ul className="space-y-5 text-left inline-block w-full">
                <li className="flex items-center gap-4 text-white font-bold text-base md:text-lg">
                  <CheckCircle size={24} className="text-yellow-500 flex-shrink-0" /> Paiement à la réception
                </li>
                <li className="flex items-center gap-4 text-white font-bold text-base md:text-lg">
                  <CheckCircle size={24} className="text-yellow-500 flex-shrink-0" /> Livraison à domicile
                </li>
                <li className="flex items-center gap-4 text-white font-bold text-base md:text-lg">
                  <CheckCircle size={24} className="text-yellow-500 flex-shrink-0" /> Qualité supérieure garantie
                </li>
                <li className="flex items-center gap-4 text-white font-bold text-base md:text-lg">
                  <CheckCircle size={24} className="text-yellow-500 flex-shrink-0" /> Service client 7j/7
                </li>
              </ul>
           </div>

           <button 
             onClick={handleBuyNow}
             className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-2xl px-8 py-6 rounded-2xl uppercase tracking-wider shadow-[0_0_30px_rgba(234,179,8,0.4)] flex justify-center items-center gap-3 transform active:scale-95 transition-transform"
           >
             <ShoppingCart size={32} />
             Je Commande
           </button>
        </div>
      </section>

      {/* FIXED BOTTOM BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 backdrop-blur-md border-t border-gray-800 z-50">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleBuyNow}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-4 py-4 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.5)] flex justify-center items-center gap-3 transform active:scale-95 transition-transform animate-bounce-short"
          >
            <ShoppingCart size={24} />
            Commander Maintenant
          </button>
        </div>
      </div>
      
      {/* Short bounce animation for the sticky button */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short {
          animation: bounce-short 3s infinite;
        }
      `}} />
    </div>
  );
}
