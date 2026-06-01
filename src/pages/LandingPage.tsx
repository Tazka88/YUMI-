import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Star, CheckCircle, Shield, Truck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const images = data.product_images ? JSON.parse(data.product_images) : [];
  const mainImage = data.product_image || (images.length > 0 ? images[0] : '');

  // Mock static data for the landing page vibe since it's dynamically generated based on the product
  const advantages = [
    { icon: <Shield size={32} />, title: "Qualité Premium", desc: "Conçu avec les meilleurs matériaux pour une durabilité exceptionnelle." },
    { icon: <Truck size={32} />, title: "Livraison Express", desc: "Recevez votre commande rapidement partout en Algérie." },
    { icon: <Star size={32} />, title: "Satisfaction Garantie", desc: "Des milliers de clients satisfaits par notre expertise." }
  ];

  const reviews = [
    { name: "Amine M.", text: "Excellente qualité, exactement ce que je cherchais. Livraison très rapide !", rating: 5 },
    { name: "Sarah K.", text: "Le design est magnifique, très élégant et fonctionne parfaitement. Je recommande !", rating: 5 },
    { name: "Karim B.", text: "Rapport qualité/prix imbattable. Service client très réactif en plus.", rating: 4 }
  ];

  const faqs = [
    { q: "Quels sont les délais de livraison ?", a: "Nous livrons dans les 24 à 48 heures dans la plupart des wilayas du pays." },
    { q: "Puis-je payer à la livraison ?", a: "Absolument ! Payez seulement lorsque vous recevez votre produit en main propre." },
    { q: "Le produit est-il sous garantie ?", a: "Oui, tous nos produits sont testés et couverts par une garantie de satisfaction." }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-yellow-500 selection:text-black">
      <Helmet>
        <title>{data.product_name} | Offre Spéciale</title>
      </Helmet>

      {/* HEADER MINI */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl tracking-tighter text-white">ZORANDO</div>
          <button onClick={handleBuyNow} className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-full transition-all transform hover:scale-105 duration-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
            Commander
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black opacity-60"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block py-1 px-3 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold mb-6 border border-yellow-500/30">
              ⚡ Offre Limitée
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              {data.product_name}
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto md:mx-0">
              Redécouvrez l'excellence. Une conception élégante, des performances remarquables, créées spécialement pour ceux qui ne font aucun compromis.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button 
                onClick={handleBuyNow}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black font-bold text-lg px-8 py-4 rounded-full transition-all transform hover:scale-105 duration-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center justify-center gap-3"
              >
                <ShoppingCart size={24} />
                Commander Maintenant
              </button>
              <div className="flex gap-2 items-center text-gray-300">
                <CheckCircle size={20} className="text-yellow-500" />
                <span>Paiement à la livraison</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-yellow-500/10 blur-[100px] rounded-full"></div>
            <img 
              src={mainImage} 
              alt={data.product_name} 
              className="w-full max-w-md mx-auto rounded-2xl shadow-2xl relative z-10 border border-white/10"
            />
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi choisir ce produit ?</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {advantages.map((adv, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-yellow-500 mb-6">
                  {adv.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{adv.title}</h3>
                <p className="text-gray-600">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Les détails qui font la différence</h2>
          <div className="prose prose-lg mx-auto text-gray-600 text-left">
            <div dangerouslySetInnerHTML={{ __html: data.product_description }} />
          </div>
        </div>
      </section>

      {/* PRICE SECTION */}
      <section className="py-24 bg-black text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Prêt à passer à l'action ?</h2>
          <p className="text-xl text-gray-400 mb-12">Ne manquez pas cette opportunité exclusive.</p>
          
          <div className="border border-white/20 bg-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500 text-black font-bold text-sm px-6 py-2 rounded-bl-2xl">
              Meilleure Vente
            </div>
            
            <div className="mb-8">
              {data.product_promo_price ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-gray-500 line-through text-2xl">{data.product_price} DA</span>
                  <span className="text-5xl font-black text-yellow-500">{data.product_promo_price} DA</span>
                </div>
              ) : (
                <span className="text-5xl font-black text-yellow-500">{data.product_price} DA</span>
              )}
            </div>

            <ul className="text-left space-y-4 mb-10 max-w-sm mx-auto">
              <li className="flex items-center gap-3"><CheckCircle className="text-yellow-500" size={24}/> Qualité garantie</li>
              <li className="flex items-center gap-3"><CheckCircle className="text-yellow-500" size={24}/> Service client 7/7</li>
              <li className="flex items-center gap-3"><CheckCircle className="text-yellow-500" size={24}/> Livraison à domicile</li>
            </ul>

            <button 
              onClick={handleBuyNow}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl px-8 py-5 rounded-xl transition-all transform hover:scale-105 duration-300 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
            >
              Commander Maintenant
            </button>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ce qu'ils en pensent</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((rev, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex text-yellow-500 mb-4">
                  {[...Array(rev.rating)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                </div>
                <p className="text-gray-700 italic mb-6">"{rev.text}"</p>
                <div className="font-bold text-black">{rev.name}</div>
                <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle size={14} /> Acheteur vérifié
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions Fréquentes</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto"></div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-left">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={20} className="text-yellow-500 flex-shrink-0" /> : <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400 py-12 border-t border-white/10 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="font-bold text-2xl tracking-tighter text-white mb-6">ZORANDO</div>
          <p className="mb-6">L'excellence à portée de main. Découvrez nos offres exclusives et bénéficiez d'un service de qualité supérieure.</p>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} ZORANDO. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
