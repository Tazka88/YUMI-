import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, Tag, CheckCircle2, X, Loader2, User, Lock, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../lib/AuthContext';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { formatPrice, getProductEffectivePrice, isPromoActive, calculateDiscountPercentage } from '../utils/formatPrice';
import SEO from '../components/SEO';

export default function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, total, appliedPromo, setAppliedPromo, getPromoDiscount, finalTotal } = useCartStore();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const discountAmount = getPromoDiscount();

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) {
      setPromoError('Veuillez entrer un code promo');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          items: items.map(item => ({
            id: item.id,
            product_id: item.id,
            price: getProductEffectivePrice(item),
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Code promo invalide');
      }

      setAppliedPromo({
        code: data.code,
        product_id: data.product_id,
        product_name: data.product_name,
        product_image: data.product_image,
        discount_percent: data.discount_percent,
        discount_amount: data.discount_amount
      });
      setPromoCodeInput('');
      toast.success(data.message || `Code promo "${data.code}" appliqué avec succès !`);
    } catch (err: any) {
      setPromoError(err.message || 'Code promo invalide');
      toast.error(err.message || 'Code promo invalide');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    toast.success('Code promo retiré');
  };

  // Automatically apply promo code from URL if provided (e.g., from WhatsApp recovery message ?promo=CODE)
  const urlPromo = searchParams.get('promo') || searchParams.get('code');
  const promoAppliedFromUrlRef = useRef(false);

  useEffect(() => {
    if (urlPromo && !appliedPromo && items.length > 0 && !promoAppliedFromUrlRef.current) {
      promoAppliedFromUrlRef.current = true;
      const autoApply = async () => {
        setIsApplyingPromo(true);
        try {
          const res = await fetch('/api/promo-codes/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: urlPromo.trim(),
              items: items.map(item => ({
                id: item.id,
                product_id: item.id,
                price: getProductEffectivePrice(item),
                quantity: item.quantity
              }))
            })
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            setAppliedPromo({
              code: data.code,
              product_id: data.product_id,
              product_name: data.product_name,
              product_image: data.product_image,
              discount_percent: data.discount_percent,
              discount_amount: data.discount_amount
            });
            toast.success(data.message || `Code promo "${data.code}" appliqué avec succès !`);
          }
        } catch (_) {
          // Silent fallback if invalid
        } finally {
          setIsApplyingPromo(false);
        }
      };
      autoApply();
    }
  }, [urlPromo, items.length, appliedPromo]);
  
  const viewCartTrackedRef = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !viewCartTrackedRef.current) {
      viewCartTrackedRef.current = true;
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        const safeValue = isNaN(total()) || total() <= 0 ? 1 : Number(Number(total()).toFixed(2));
        try {
          window.gtag("event", "view_cart", {
            currency: "DZD",
            value: safeValue,
            items: items.map(item => ({
              item_id: item.id.toString(),
              item_name: item.name,
              price: getProductEffectivePrice(item),
              quantity: item.quantity,
              item_category: item.category_name || undefined
            }))
          });
        } catch (e) {
          console.error('Failed to send GA view_cart event', e);
        }
      }
    }
  }, [items, total]);

  const handleRemoveItem = (item) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        const itemPrice = getProductEffectivePrice(item);
        const safeValue = isNaN(itemPrice * item.quantity) || itemPrice * item.quantity <= 0 ? 1 : Number(Number(itemPrice * item.quantity).toFixed(2));
        window.gtag("event", "remove_from_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: item.id.toString(),
            item_name: item.name,
            price: itemPrice,
            quantity: item.quantity,
            item_category: item.category_name || undefined
          }]
        });
      } catch (e) {
        console.error('Failed to send GA remove_from_cart event', e);
      }
    }
    removeItem(item.cartItemId || item.id);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <SEO title="Panier" description="Votre panier ZORANDO." noindex={true} />
        <div className="bg-orange-100 p-6 rounded-full text-orange-500 mb-6">
          <ShoppingBag size={64} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Parcourez nos catégories et découvrez nos meilleures offres pour remplir votre panier.
        </p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-md">
          Commencer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Panier" description="Votre panier ZORANDO." noindex={true} />
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Mon Panier ({items.length} articles)</h1>

      {/* Anonymous visitor registration alert */}
      {!user && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <Lock size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-black text-sm text-gray-900 flex items-center gap-2">
                <span>Enregistrez votre panier pour ne pas le perdre</span>
                <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Recommandé</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Connectez-vous ou créez votre compte afin de sauvegarder vos articles, valider votre livraison 58 wilayas et profiter de vos réductions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Link
              to="/account/login"
              state={{ from: { pathname: '/cart' } }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition shadow-xs"
            >
              <LogIn size={14} />
              <span>Se connecter</span>
            </Link>
            <Link
              to="/account/register"
              state={{ from: { pathname: '/cart' } }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-black transition shadow-md shadow-orange-500/25"
            >
              <UserPlus size={14} />
              <span>Créer mon compte</span>
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3 space-y-4">
          {items.map((item) => {
            const currentPrice = getProductEffectivePrice(item);
            const isPromo = isPromoActive(item);
            const discount = isPromo ? calculateDiscountPercentage(item.price, currentPrice) : 0;
            const itemImage = item.selectedVariation?.image ? (item.selectedVariation.image.startsWith('http') || item.selectedVariation.image.startsWith('/api') ? item.selectedVariation.image : '/api/images/' + item.selectedVariation.image) : item.image;
            return (
              <div key={item.cartItemId || item.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
                <Link to={`/product/${item.slug}`} className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-50 border border-gray-100">
                  <img 
                    src={itemImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&size=200`} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                
                <div className="flex-1">
                  <Link to={`/product/${item.slug}`} className="font-medium text-gray-800 hover:text-orange-500 line-clamp-2 mb-1">
                    {item.name}
                  </Link>
                  {item.selectedVariation && (
                    <div className="text-sm text-gray-500 mb-1 bg-gray-50 inline-block px-2 py-1 rounded">
                      <span className="font-medium">{item.selectedVariation.attribute} :</span> {item.selectedVariation.value}
                    </div>
                  )}
                  <div className="text-sm text-gray-400 mb-2">Vendeur: ZORANDO Express</div>
                  {isPromo && discount > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-gray-400 line-through font-normal">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-lg font-black text-[#FF6B00]">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="bg-[#FF6B00] text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded shadow-xs leading-none">
                        -{discount}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-900">{formatPrice(currentPrice)}</div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => updateQuantity(item.cartItemId || item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => {
                         const maxStock = item.selectedVariation?.stock ?? item.stock;
                         updateQuantity(item.cartItemId || item.id, Math.min(maxStock, item.quantity + 1))
                      }}
                      disabled={item.quantity >= (item.selectedVariation?.stock ?? item.stock)}
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveItem(item)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Résumé de la commande</h2>
            
            {/* Promo Code Section */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Tag size={14} className="text-orange-500" />
                Code promo
              </label>

              {appliedPromo ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                          <span>{appliedPromo.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-semibold">
                            -{appliedPromo.discount_percent}%
                          </span>
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Appliqué sur : <span className="font-medium">{appliedPromo.product_name}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md transition"
                      title="Supprimer le code promo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError(null);
                      }}
                      placeholder="Ex: RETOUR10"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingPromo || !promoCodeInput.trim()}
                      className="px-4 py-2 bg-gray-900 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-md transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {isApplyingPromo ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Appliquer'
                      )}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-red-500 font-medium">{promoError}</p>
                  )}
                </form>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total ({items.reduce((acc, item) => acc + item.quantity, 0)} articles)</span>
                <span className="font-medium">{formatPrice(total())}</span>
              </div>
              {appliedPromo && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium text-sm">
                  <span className="flex items-center gap-1">
                    <Tag size={13} />
                    Réduction ({appliedPromo.code})
                  </span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="text-sm text-orange-500">Calculés à l'étape suivante</span>
              </div>
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-800">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">{formatPrice(finalTotal())}</span>
                  <div className="text-xs text-gray-500">TVA incluse</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (!user) {
                  toast('Veuillez vous connecter ou créer votre compte pour continuer.', { icon: '🔒' });
                  navigate('/account/login', { state: { from: { pathname: '/checkout' } } });
                  return;
                }
                navigate('/checkout');
              }}
              className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <span>Passer la commande</span>
              <ArrowRight size={20} />
            </button>
            
            <div className="mt-4 text-xs text-center text-gray-500">
              Paiement 100% sécurisé à la livraison.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
