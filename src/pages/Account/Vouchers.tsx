import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { useCartStore } from '../../store/cartStore';
import { formatPrice, getProductEffectivePrice } from '../../utils/formatPrice';

interface CustomerVoucher {
  id: number;
  code: string;
  amount: number;
  minimum_order_amount: number;
  reason?: string | null;
  status: 'available' | 'reserved' | 'used' | 'cancelled' | 'expired';
  allow_promo_stacking: boolean;
  excluded_product_ids?: number[];
  order_ref?: string | null;
  created_at: string;
  expires_at?: string | null;
  used_at?: string | null;
}

export default function Vouchers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, appliedPromo, setAppliedVoucher } = useCartStore();

  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [summary, setSummary] = useState({ totalAvailableBalance: 0, availableCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'used' | 'other'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const getCustomerToken = async (): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  };

  useEffect(() => {
    if (!user) return;
    const fetchMyVouchers = async () => {
      setLoading(true);
      try {
        const token = await getCustomerToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch('/api/account/vouchers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setVouchers(Array.isArray(data.vouchers) ? data.vouchers : []);
          if (data.summary) setSummary(data.summary);
        }
      } catch (err) {
        console.error('Error fetching vouchers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyVouchers();
  }, [user]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code ${code} copié dans le presse-papier !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUseVoucher = async (voucher: CustomerVoucher) => {
    if (voucher.status !== 'available') return;

    if (items.length === 0) {
      try {
        sessionStorage.setItem('zorando_pending_voucher_code', voucher.code);
      } catch (_) {}
      navigator.clipboard?.writeText(voucher.code).catch(() => {});
      const minText =
        Number(voucher.minimum_order_amount) > 0
          ? ` (panier min. ${formatPrice(voucher.minimum_order_amount)} hors livraison)`
          : '';
      toast.success(
        `Bon ${voucher.code} sélectionné${minText} ! Ajoutez vos produits au panier pour l'appliquer.`,
        { duration: 4500 }
      );
      navigate('/');
      return;
    }

    setApplyingId(voucher.id);
    try {
      const token = await getCustomerToken();
      if (!token) {
        toast.error('Veuillez vous reconnecter pour utiliser votre bon.');
        return;
      }

      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: voucher.code,
          has_promo_code: Boolean(appliedPromo),
          items: items.map((it) => ({
            id: it.id,
            product_id: it.id,
            price: getProductEffectivePrice(it),
            quantity: it.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid && data.voucher) {
        setAppliedVoucher(data.voucher);
        toast.success(data.message || `Bon ${voucher.code} appliqué à votre panier !`);
        navigate('/cart');
      } else {
        try {
          sessionStorage.setItem('zorando_pending_voucher_code', voucher.code);
        } catch (_) {}
        toast.error(data.error || 'Conditions non atteintes dans votre panier actuel.');
        navigate(`/cart?voucher=${encodeURIComponent(voucher.code)}`);
      }
    } catch (_) {
      toast.error('Erreur lors de l\'application du bon d\'achat.');
    } finally {
      setApplyingId(null);
    }
  };

  const getStatusMeta = (status: CustomerVoucher['status']) => {
    switch (status) {
      case 'available':
        return {
          label: 'Disponible',
          badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          cardBorder: 'border-orange-200 hover:border-[#FF6B00]',
          icon: CheckCircle2,
        };
      case 'reserved':
        return {
          label: 'Réservé sur commande',
          badgeCls: 'bg-amber-100 text-amber-800 border-amber-200',
          cardBorder: 'border-amber-200',
          icon: Clock,
        };
      case 'used':
        return {
          label: 'Utilisé',
          badgeCls: 'bg-blue-100 text-blue-800 border-blue-200',
          cardBorder: 'border-gray-200 opacity-85',
          icon: Check,
        };
      case 'expired':
        return {
          label: 'Expiré',
          badgeCls: 'bg-gray-100 text-gray-600 border-gray-200',
          cardBorder: 'border-gray-200 opacity-75',
          icon: AlertCircle,
        };
      case 'cancelled':
        return {
          label: 'Annulé',
          badgeCls: 'bg-red-100 text-red-700 border-red-200',
          cardBorder: 'border-red-100 opacity-75',
          icon: Ban,
        };
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (filter === 'available') return v.status === 'available' || v.status === 'reserved';
    if (filter === 'used') return v.status === 'used';
    if (filter === 'other') return v.status === 'expired' || v.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#FF6B00]" />
            <span>Mes bons d'achat</span>
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Retrouvez vos bons d'achat commerciaux et utilisez-les directement sur vos commandes ZORANDO.
          </p>
        </div>
      </div>

      {/* ZORANDO Orange/Black Balance Banner */}
      <div className="rounded-3xl bg-gray-950 text-white p-6 sm:p-7 relative overflow-hidden shadow-lg">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#FF6B00]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1.5">
              <Sparkles size={14} />
              <span>Solde total disponible</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatPrice(summary.totalAvailableBalance)}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {summary.availableCount > 0
                ? `Vous disposez actuellement de ${summary.availableCount} bon${summary.availableCount > 1 ? 's' : ''} d'achat prêt${summary.availableCount > 1 ? 's' : ''} à être utilisé${summary.availableCount > 1 ? 's' : ''}.`
                : 'Aucun bon disponible pour le moment.'}
            </p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-xs text-gray-200 max-w-xs space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Info size={14} className="text-[#FF6B00]" />
              <span>Règles d'utilisation</span>
            </div>
            <p>• Calculé uniquement sur le montant des produits (hors frais de livraison).</p>
            <p>• Usage unique et strictement nominatif sur votre compte.</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Tous (${vouchers.length})` },
          {
            id: 'available',
            label: `Disponibles (${vouchers.filter((v) => v.status === 'available' || v.status === 'reserved').length})`,
          },
          { id: 'used', label: `Utilisés (${vouchers.filter((v) => v.status === 'used').length})` },
          {
            id: 'other',
            label: `Expirés / Annulés (${vouchers.filter((v) => v.status === 'expired' || v.status === 'cancelled').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              filter === tab.id
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-orange-400">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Aucun bon d'achat dans cette catégorie</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Vos bons de compensation et avantages commerciaux attribués par ZORANDO s'afficheront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVouchers.map((v) => {
            const meta = getStatusMeta(v.status);
            const StatusIcon = meta.icon;
            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border-2 p-5 shadow-xs transition-all flex flex-col justify-between gap-4 ${meta.cardBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-2xl font-black text-[#FF6B00] leading-none">
                        {formatPrice(v.amount)}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 mt-1.5">
                        {Number(v.minimum_order_amount) > 0
                          ? `Dès ${formatPrice(v.minimum_order_amount)} d'achats (hors livraison)`
                          : 'Sans minimum d\'achat requis'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${meta.badgeCls}`}
                    >
                      <StatusIcon size={12} />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Code box */}
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Code du bon
                      </div>
                      <div className="font-mono font-black text-sm text-gray-900 tracking-wide">
                        {v.code}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(v.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-900 text-xs font-bold text-gray-800 transition"
                    >
                      {copiedCode === v.code ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copier le code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span>Émis le {new Date(v.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span>
                        {v.expires_at
                          ? `Expire le ${new Date(v.expires_at).toLocaleDateString('fr-FR')}`
                          : 'Validité illimitée'}
                      </span>
                    </div>
                  </div>

                  {v.reason && (
                    <div className="text-xs text-gray-600 bg-orange-50/60 border border-orange-100 rounded-xl px-3 py-2">
                      <span className="font-bold text-gray-800">Motif :</span> {v.reason}
                    </div>
                  )}

                  {v.order_ref && (
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <ShoppingBag size={13} className="text-gray-400" />
                      <span>
                        Associé à la commande <strong className="text-gray-800">{v.order_ref}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {v.status === 'available' && (
                  <button
                    type="button"
                    disabled={applyingId === v.id}
                    onClick={() => handleUseVoucher(v)}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-sm shadow-orange-500/20 disabled:opacity-50"
                  >
                    <span>{applyingId === v.id ? 'Vérification...' : 'Utiliser mon bon'}</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
