import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Truck, ShieldCheck, CheckCircle, Star, Package, 
  ArrowRight, Shield, ChevronDown, Zap, Award, ThumbsUp, CreditCard, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function DynamicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Form state
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    quantity: 1
  });
  
  const [wilayas, setWilayas] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/landing-pages/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPage(data);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => setLoading(false));

    fetch('/api/wilayas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWilayas(data);
      })
      .catch(console.error);

    const handleScroll = () => {
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.phone || !orderForm.wilaya) {
      return toast.error("Veuillez remplir les champs obligatoires");
    }

    setSubmitting(true);
    const selectedWilaya = wilayas.find(w => w.name === orderForm.wilaya);
    const deliveryCost = selectedWilaya ? parseFloat(selectedWilaya.delivery_cost) : 0;
    const itemPrice = page.promo_price || page.price;
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: orderForm.name,
          customer_phone: orderForm.phone,
          wilaya: orderForm.wilaya,
          commune: orderForm.commune,
          address: orderForm.address,
          total_amount: (itemPrice * orderForm.quantity) + deliveryCost,
          delivery_cost: deliveryCost,
          items: [{
            product_id: page.product_id,
            quantity: orderForm.quantity,
            price: itemPrice
          }]
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        toast.success("Commande effectuée avec succès !");
        setTimeout(() => {
          window.location.href = `/checkout/success?order=${orderData.order_id || '123'}`;
        }, 1500);
      } else {
        toast.error("Erreur lors de la commande");
      }
    } catch (err) {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent flex rounded-full animate-spin"></div></div>;
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Package className="w-20 h-20 text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Introuvable</h1>
        <p className="text-gray-500 mb-8">Cette page n'existe pas ou l'offre exclusive a expiré.</p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-8 py-4 rounded-xl font-bold tracking-tight">Retour à la boutique</Link>
      </div>
    );
  }

  const { config, product_name, product_description, price, promo_price, product_images, product_reviews, features, key_points } = page;
  
  const displayPrice = promo_price || price;
  const isDiscounted = promo_price && promo_price < price;
  const savings = isDiscounted ? (price - promo_price) : 0;
  const discountPercent = isDiscounted ? Math.round((savings / price) * 100) : 0;

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFaqs = () => {
    const list = [];
    if (page.faq_q1 && page.faq_a1) list.push({ q: page.faq_q1, a: page.faq_a1 });
    if (page.faq_q2 && page.faq_a2) list.push({ q: page.faq_q2, a: page.faq_a2 });
    if (list.length === 0) {
      list.push({ q: "Quand vais-je recevoir ma commande ?", a: "La livraison s'effectue généralement entre 24h et 72h selon votre wilaya." });
      list.push({ q: "Comment se passe le paiement ?", a: "Vous ne payez rien maintenant ! Le paiement se fait en espèces lors de la réception de votre colis." });
    }
    return list;
  };
  const parsedFaqs = getFaqs();

  const primaryImages = [page.product_image, ...(product_images?.map((img:any) => img.image_url) || [])].filter(Boolean).slice(0, 4);

  return (
    <div className="font-sans antialiased text-gray-800 bg-white selection:bg-orange-200">
      <Helmet>
        <title>{config.seo_title || `${product_name} - Offre Exclusive`}</title>
        <meta name="description" content={config.seo_description || `Achetez ${product_name} en promotion. Paiement à la livraison 58 Wilayas.`} />
      </Helmet>

      {/* Top Announcement Bar */}
      <div className="bg-gray-900 text-white text-center py-2.5 px-4 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2">
        <Zap size={14} className="text-yellow-400" />
        Offre flash : Stock limité, commandez aujourd'hui !
        <Zap size={14} className="text-yellow-400" />
      </div>

      {/* Floating Sticky CTA on Mobile (appears on scroll) */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-4 left-4 right-4 z-50"
          >
            <button onClick={scrollToOrder} className="w-full bg-orange-600 text-white font-black py-4 px-4 rounded-2xl shadow-[0_8px_30px_rgba(234,88,12,0.4)] border-2 border-orange-400 active:scale-95 transition-transform flex items-center justify-center gap-3 text-lg">
              COMMANDER MAINTENANT <ArrowRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="bg-white pt-6 pb-12 lg:pt-16 lg:pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Gallery Area */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-50 border border-gray-100 aspect-square flex items-center justify-center">
                <img 
                  src={primaryImages[0]} 
                  alt={product_name} 
                  className="w-full h-full object-cover mix-blend-multiply"
                />
                {isDiscounted && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-xl px-4 py-2 rounded-xl shadow-lg transform -rotate-2">
                    -{discountPercent}%
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  En Stock
                </div>
              </div>
              
              {/* Mini Thumbnails */}
              {primaryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {primaryImages.slice(1, 4).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm">
                      <img src={img} className="w-full h-full object-cover" alt="Detail" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Content Area */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-2 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-1.5 text-orange-600 font-bold mb-4 bg-orange-50 px-3 py-1.5 rounded-lg text-sm border border-orange-100">
                <Star size={16} fill="currentColor" /> {product_reviews?.length > 0 ? `${product_reviews.length} Avis clients` : 'Plus de 500+ clients satisfaits'}
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-[1.1] tracking-tight">
                {config.hero_title || product_name}
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 whitespace-pre-line leading-relaxed max-w-xl mx-auto lg:mx-0">
                {config.hero_subtitle || product_description?.substring(0, 250) + '...'}
              </p>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center lg:justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Prix Spécial</div>
                    <div className="flex items-end justify-center sm:justify-start gap-3">
                      {isDiscounted && (
                        <span className="text-gray-400 line-through text-2xl font-medium mb-1">{price} DA</span>
                      )}
                      <span className="text-5xl font-black text-orange-600 tracking-tight">{displayPrice} DA</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={scrollToOrder} 
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-1 active:translate-y-0 text-xl flex items-center justify-center gap-3 whitespace-nowrap"
                  >
                    COMMANDER <ArrowRight size={24} />
                  </button>
                </div>
              </div>

              {/* Trust badges row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-full"><ShieldCheck size={24} /></div>
                  <span className="text-xs font-bold text-gray-700">Garantie 1 An</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="bg-green-50 text-green-600 p-3 rounded-full"><CreditCard size={24} /></div>
                  <span className="text-xs font-bold text-gray-700">Paiement à la livraison</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="bg-purple-50 text-purple-600 p-3 rounded-full"><Truck size={24} /></div>
                  <span className="text-xs font-bold text-gray-700">Livraison 58 Wilayas</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-full"><Clock size={24} /></div>
                  <span className="text-xs font-bold text-gray-700">Support 7/7</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="bg-gray-900 border-y border-gray-800 py-6 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center text-white/90">
            <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><span className="font-bold tracking-wide">QUALITÉ PREMIUM</span></div>
            <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><span className="font-bold tracking-wide">SATISFAIT OU REMBOURSÉ</span></div>
            <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><span className="font-bold tracking-wide">PAIEMENT SÉCURISÉ</span></div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      {(key_points && Array.isArray(key_points) && key_points.length > 0) && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Ce qui rend ce produit unique</h2>
              <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {key_points.map((pt: string, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-5 hover:shadow-md transition-shadow"
                >
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-xl shrink-0">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Avantage #{idx + 1}</h3>
                    <p className="text-gray-600 leading-relaxed">{pt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <button onClick={scrollToOrder} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2 mx-auto">
                <Truck size={20} /> Obtenir ce produit maintenant
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof / Reviews */}
      {product_reviews && product_reviews.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Déjà approuvé par nos clients</h2>
              <div className="flex justify-center items-center gap-1 text-orange-400 mb-2">
                <Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" />
              </div>
              <p className="text-gray-500 font-medium">Note moyenne de 4.9/5 basée sur +400 avis</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {product_reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="bg-gray-50 p-8 rounded-3xl border border-gray-100 relative">
                  <div className="absolute top-6 right-6 text-orange-200">
                    <ThumbsUp size={40} />
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 mb-4">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                  </div>
                  <p className="italic text-gray-700 mb-6 relative z-10 leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                      {review.customer_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{review.customer_name}</h4>
                      <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Achat vérifié
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Questions Fréquentes</h2>
          </div>
          <div className="space-y-4">
            {parsedFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`transform transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-gray-600 leading-relaxed bg-white"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout / Order Form Section */}
      <section id="order-form" className="py-20 lg:py-24 bg-gray-900 relative overflow-hidden">
        {/* Visual Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 absolute pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 absolute pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">
            
            {/* Sales Pitch Side */}
            <div className="text-white flex flex-col justify-center">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Il est temps de passer à l'action.</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Remplissez le formulaire de commande. Notre équipe vous contactera dans les plus brefs délais pour confirmer votre livraison. 
                <strong className="text-white block mt-2 text-xl">Vous ne payez qu'à la réception !</strong>
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/20 text-orange-400 p-3 rounded-full mt-1"><Truck size={24} /></div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-white">Livraison Rapide</h3>
                    <p className="text-gray-400">Partout en Algérie directement à votre porte.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/20 text-orange-400 p-3 rounded-full mt-1"><ShieldCheck size={24} /></div>
                  <div>
                    <h3 className="font-bold text-xl mb-1 text-white">Qualité Garantie</h3>
                    <p className="text-gray-400">Des produits testés et vérifiés avant expédition.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">Demande de Livraison</h3>
                <p className="text-gray-500">Formulaire 100% Sécurisé</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Nom et Prénom <span className="text-red-500">*</span></label>
                    <input type="text" required value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" placeholder="Ex: Amina" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Téléphone <span className="text-red-500">*</span></label>
                    <input type="tel" required value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-left" placeholder="05XX XX XX XX" dir="ltr" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Wilaya <span className="text-red-500">*</span></label>
                    <select required value={orderForm.wilaya} onChange={e => setOrderForm({...orderForm, wilaya: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium bg-white">
                      <option value="">-- Choisir --</option>
                      {wilayas.map((w: any) => (
                        <option key={w.number} value={w.name}>{w.number} - {w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Commune</label>
                    <input type="text" value={orderForm.commune} onChange={e => setOrderForm({...orderForm, commune: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" placeholder="Ex: Rouiba" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Adresse Exacte (Optionnel)</label>
                  <textarea rows={2} value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none font-medium text-sm" placeholder="Rue, Bâtiment..."></textarea>
                </div>

                {/* Recapitulation */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mt-6">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                    <img src={primaryImages[0]} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 line-clamp-1">{product_name}</h4>
                      <div className="text-orange-600 font-bold whitespace-nowrap">{displayPrice} DZD</div>
                    </div>
                    <div className="flex items-center overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm">
                      <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))} className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold transition-colors select-none">-</button>
                      <span className="w-10 text-center font-bold">{orderForm.quantity}</span>
                      <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: f.quantity + 1 }))} className="px-3 py-1.5 hover:bg-gray-100 text-gray-600 font-bold transition-colors select-none">+</button>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Sous-total</span>
                      <span className="font-bold text-gray-800">{(displayPrice * orderForm.quantity).toLocaleString()} DZD</span>
                    </div>
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Frais de livraison</span>
                      <span className="font-bold text-gray-800">{orderForm.wilaya ? `${wilayas.find(w => w.name === orderForm.wilaya)?.delivery_cost || 0} DZD` : '--'}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-200 mt-2">
                      <span>Total à Payer :</span>
                      <span className="text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">
                        {((displayPrice * orderForm.quantity) + (orderForm.wilaya ? parseFloat(wilayas.find(w => w.name === orderForm.wilaya)?.delivery_cost || 0) : 0)).toLocaleString()} DZD
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-[17px] tracking-wide font-black py-4 rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all flex items-center justify-center gap-2 mt-2 border border-orange-400"
                >
                  {submitting ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : (
                    <>CONFIRMER LA COMMANDE <CheckCircle className="ml-1" size={22} /></>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 font-medium mt-4 flex items-center justify-center gap-1.5">
                  <Shield size={14} className="text-green-500" /> Vos informations sont sécurisées.
                </p>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

