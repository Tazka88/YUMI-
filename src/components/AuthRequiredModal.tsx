import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Lock, UserPlus, LogIn, CheckCircle2, ShieldCheck, Truck, Gift } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: number;
    name: string;
    price: number;
    promo_price?: number | null;
    image?: string;
  };
  quantity?: number;
  selectedVariation?: any;
  customTitle?: string;
  customSubtitle?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity = 1,
  selectedVariation,
  customTitle,
  customSubtitle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = getSupabase();

  if (!isOpen) return null;

  const savePendingItem = () => {
    if (product) {
      try {
        sessionStorage.setItem('zorando_pending_cart_item', JSON.stringify({
          product,
          quantity,
          selectedVariation,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Failed to save pending cart item:', e);
      }
    }
  };

  const handleGoToRegister = () => {
    savePendingItem();
    onClose();
    navigate('/account/register', { state: { from: { pathname: location.pathname } } });
  };

  const handleGoToLogin = () => {
    savePendingItem();
    onClose();
    navigate('/account/login', { state: { from: { pathname: location.pathname } } });
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast.error('Impossible de se connecter à la base de données.');
      return;
    }
    savePendingItem();
    try {
      const redirectUrl = `${window.location.origin}${location.pathname}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      toast.error('Échec de la connexion Google: ' + (err.message || 'erreur inconnue'));
    }
  };

  const effectivePrice = product?.promo_price && product.promo_price > 0 && product.promo_price < product.price
    ? product.promo_price
    : product?.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Close Button */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-orange-50/80 to-white border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Lock size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                {customTitle || 'Enregistrez votre panier'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {customSubtitle || 'Une inscription rapide est requise pour ajouter vos articles'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Product Thumbnail Preview (if adding a product) */}
          {product && (
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center gap-3">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <Lock size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-gray-900 truncate">{product.name}</p>
                {selectedVariation && (
                  <p className="text-[11px] text-gray-500">
                    {selectedVariation.attribute} : {selectedVariation.value}
                  </p>
                )}
                <p className="text-xs font-black text-[#FF6B00] mt-0.5">
                  {effectivePrice ? formatPrice(effectivePrice) : ''} {quantity > 1 ? `(× ${quantity})` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Value Props / Guarantees */}
          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span><strong>Sauvegarde garantie</strong> de votre panier en cas d'interruption</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-orange-500 shrink-0" />
              <span>Livraison rapide et sécurisée dans les <strong>58 wilayas</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-amber-500 shrink-0" />
              <span>Accès exclusif aux <strong>codes promos VIP (3%, 5%, 10%)</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Create Account Button */}
            <button
              type="button"
              onClick={handleGoToRegister}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-orange-600 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <UserPlus size={18} />
              <span>Créer mon compte (30 sec)</span>
            </button>

            {/* Login Button */}
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn size={16} className="text-gray-500" />
              <span>Déjà client ? Se connecter</span>
            </button>

            {/* Google 1-Click Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-gray-400">
            Paiement 100% sécurisé à la livraison partout en Algérie.
          </p>
        </div>
      </div>
    </div>
  );
};
