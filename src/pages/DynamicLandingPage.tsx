import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Truck, ShieldCheck, CheckCircle, Star, StarHalf, Package, ArrowRight, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DynamicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Introuvable</h1>
        <p className="text-gray-500 mb-8">Cette page n'existe pas ou l'offre a expiré.</p>
        <Link to="/" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold">Retour à la boutique</Link>
      </div>
    );
  }

  const { config, product_name, product_description, price, promo_price, product_images, product_reviews, features, key_points } = page;
  
  const displayPrice = promo_price || price;
  const isDiscounted = promo_price && promo_price < price;
  const savings = isDiscounted ? (price - promo_price) : 0;

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans antialiased text-gray-800 bg-white selection:bg-orange-200">
      <Helmet>
        <title>{config.seo_title || `${product_name} - Offre Spéciale`}</title>
        <meta name="description" content={config.seo_description || `Achetez ${product_name} avec livraison rapide.`} />
      </Helmet>

      {/* Floating CTA Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={scrollToOrder} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg">
          Commander Maintenant <ArrowRight size={20} />
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white pt-8 pb-12 lg:pt-16 lg:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual */}
            <div className="relative z-10 order-1 lg:order-2">
              <div className="absolute inset-0 bg-orange-500/10 rounded-[2rem] transform rotate-3 scale-105"></div>
              <img 
                src={page.product_image} 
                alt={product_name} 
                className="relative rounded-2xl shadow-2xl w-full h-auto object-cover max-h-[600px] border-4 border-white"
              />
              {isDiscounted && (
                <div className="absolute -top-4 -right-4 bg-red-500 text-white font-black text-xl px-5 py-3 rounded-full shadow-lg transform rotate-12">
                  - {Math.round((savings / price) * 100)}%
                </div>
              )}
            </div>

            {/* Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-1 text-orange-600 font-semibold mb-6 bg-orange-50 px-4 py-2 rounded-full text-sm">
                <Star size={16} fill="currentColor" /> Plus de 500+ clients satisfaits
              </div>
              <h1 className="text-4xl lg:text-5xl lg:leading-[1.1] font-black text-gray-900 mb-6 tracking-tight">
                {config.hero_title || product_name}
              </h1>
              <p className="text-lg text-gray-600 mb-8 whitespace-pre-line max-w-2xl mx-auto lg:mx-0">
                {config.hero_subtitle || product_description?.substring(0, 200) + '...'}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start mb-10">
                <div className="text-center sm:text-left">
                  {isDiscounted ? (
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-gray-400 line-through text-xl">{price} DZD</span>
                      <span className="text-5xl font-black text-orange-600">{promo_price} DZD</span>
                    </div>
                  ) : (
                    <span className="text-4xl font-black text-orange-600">{price} DZD</span>
                  )}
                </div>
                
                <button onClick={scrollToOrder} className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-1 items-center gap-2 text-lg whitespace-nowrap">
                  Je commande <ArrowRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <CheckCircle className="text-green-500" size={20} /> Paiement à la livraison
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Truck className="text-orange-500" size={20} /> Livraison 58 Wilayas
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <ShieldCheck className="text-blue-500" size={20} /> Satisfait ou remboursé
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Package className="text-purple-500" size={20} /> Stock limité
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Description / Key Points */}
      {(key_points && Array.isArray(key_points) && key_points.length > 0) && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-black text-center mb-10">Pourquoi choisir ce produit ?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {key_points.map((pt: string, idx: number) => (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 items-start">
                  <div className="mt-1 bg-orange-100 text-orange-600 p-2 rounded-full">
                    <CheckCircle size={20} />
                  </div>
                  <p className="font-medium text-gray-700">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Images Gallery */}
      {product_images && product_images.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product_images.slice(0, 4).map((img: any) => (
                <img key={img.id} src={img.image_url} alt="Détail produit" className="rounded-2xl shadow-sm border border-gray-200 aspect-square object-cover" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Order Form Section */}
      <section id="order-form" className="py-20 bg-gray-900 border-t-8 border-orange-500">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Finalisez votre commande</h2>
            <p className="text-gray-400">Remplissez le formulaire ci-dessous, notre équipe vous contactera pour confirmer.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nom et Prénom <span className="text-red-500">*</span></label>
                  <input type="text" required value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition-colors" placeholder="Ex: Mohamed Amin" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Numéro de téléphone <span className="text-red-500">*</span></label>
                  <input type="tel" required value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-0 text-left transition-colors" placeholder="05XX XX XX XX" dir="ltr" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Wilaya <span className="text-red-500">*</span></label>
                  <select required value={orderForm.wilaya} onChange={e => setOrderForm({...orderForm, wilaya: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition-colors bg-white">
                    <option value="">Sélectionnez votre Wilaya</option>
                    {wilayas.map((w: any) => (
                      <option key={w.number} value={w.name}>{w.number} - {w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Commune</label>
                  <input type="text" value={orderForm.commune} onChange={e => setOrderForm({...orderForm, commune: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition-colors" placeholder="Votre commune" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adresse complète (Optionnel)</label>
                <textarea rows={2} value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-0 transition-colors resize-none" placeholder="Rue, Bâtiment, Quartier..."></textarea>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mt-8">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                  <img src={page.product_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{product_name}</h4>
                    <div className="text-orange-600 font-bold">{displayPrice} DZD</div>
                  </div>
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white">
                    <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">-</button>
                    <span className="w-10 text-center font-bold text-sm">{orderForm.quantity}</span>
                    <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: f.quantity + 1 }))} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">+</button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span className="font-medium">{(displayPrice * orderForm.quantity).toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span className="font-medium">{orderForm.wilaya ? `${wilayas.find(w => w.name === orderForm.wilaya)?.delivery_cost || 0} DZD` : 'Calculé après sélection'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-200 mt-3">
                    <span>Total à Payer</span>
                    <span className="text-orange-600">
                      {((displayPrice * orderForm.quantity) + (orderForm.wilaya ? parseFloat(wilayas.find(w => w.name === orderForm.wilaya)?.delivery_cost || 0) : 0)).toLocaleString()} DZD
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-lg font-black py-4 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                {submitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                  <>Valider ma commande <CheckCircle className="ml-1" size={22} /></>
                )}
              </button>
              
              <div className="text-center mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
                <Shield size={16} /> Vous ne payez qu'à la réception du colis
              </div>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
