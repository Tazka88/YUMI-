import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Ticket,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Ban,
  Copy,
  Check,
  Calendar,
  UserCheck,
  History,
  Settings2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Coins,
  PackageX,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

interface Voucher {
  id: number;
  user_id: string;
  user_email: string;
  user_name?: string;
  code: string;
  amount: number;
  minimum_order_amount: number;
  reason?: string;
  status: 'available' | 'reserved' | 'used' | 'cancelled' | 'expired';
  allow_promo_stacking: boolean;
  excluded_product_ids?: number[];
  order_id?: number | null;
  order_ref?: string | null;
  order_status?: string | null;
  order_total_amount?: number | null;
  created_by?: string | null;
  created_at: string;
  expires_at?: string | null;
  reserved_at?: string | null;
  used_at?: string | null;
  cancelled_at?: string | null;
}

interface VoucherStats {
  total_issued: number;
  total_used: number;
  total_available: number;
  total_reserved: number;
  total_expired: number;
  total_cancelled: number;
  total_issued_value: number;
  total_used_value: number;
  total_available_value: number;
}

interface CustomerSearchResult {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  orders_count: number;
  active_vouchers_count: number;
}

interface VoucherTier {
  amount: number;
  minCart: number;
}

interface HistoryEntry {
  id: number;
  voucher_id: number;
  code: string;
  user_email: string;
  user_name?: string;
  action: string;
  actor_type: string;
  actor_id: string;
  order_ref?: string | null;
  amount?: number | null;
  details?: any;
  created_at: string;
}

const DEFAULT_TIERS: VoucherTier[] = [
  { amount: 500, minCart: 10000 },
  { amount: 1000, minCart: 15000 },
  { amount: 2000, minCart: 30000 },
];

const QUICK_REASONS = [
  'Produit manquant / incomplet',
  'Retard de livraison',
  'Article endommagé à la réception',
  'Erreur de préparation commande',
  'Geste commercial fidélité',
];

export default function VouchersAdmin() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<VoucherStats>({
    total_issued: 0,
    total_used: 0,
    total_available: 0,
    total_reserved: 0,
    total_expired: 0,
    total_cancelled: 0,
    total_issued_value: 0,
    total_used_value: 0,
    total_available_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'used' | 'expired' | 'cancelled'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | '500' | '1000' | '2000' | 'custom'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Config state
  const [tiers, setTiers] = useState<VoucherTier[]>(DEFAULT_TIERS);
  const [globalAllowStacking, setGlobalAllowStacking] = useState(false);
  const [globalExcludedProducts, setGlobalExcludedProducts] = useState<any[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configProductSearch, setConfigProductSearch] = useState('');
  const [configProductResults, setConfigProductResults] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Customer Lookup
  const [customerEmailSearch, setCustomerEmailSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    amount: 1000,
    isCustomAmount: false,
    minimum_order_amount: 15000,
    reason: 'Produit manquant / incomplet',
    has_expiry: true,
    expires_at: '',
    allow_promo_stacking: false,
    excluded_product_ids: [] as number[],
  });

  // Cancel confirmation modal
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; voucher: Voucher | null; reason: string }>({
    isOpen: false,
    voucher: null,
    reason: 'Annulé par l\'administrateur',
  });

  // History modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('Historique global des bons d\'achat');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vouchers', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du chargement des bons d\'achat');
      setVouchers(Array.isArray(data.vouchers) ? data.vouchers : []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des bons d\'achat');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/vouchers/config', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tiers) && data.tiers.length > 0) setTiers(data.tiers);
        setGlobalAllowStacking(Boolean(data.allowPromoStacking));
        setGlobalExcludedProducts(Array.isArray(data.excludedProductsDetails) ? data.excludedProductsDetails : []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchVouchers();
    fetchConfig();
  }, []);

  // Debounced Customer Email Search
  useEffect(() => {
    if (!customerEmailSearch.trim() || customerEmailSearch.trim().length < 2 || selectedCustomer) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await fetch(
          `/api/admin/vouchers/customer-search?email=${encodeURIComponent(customerEmailSearch.trim())}`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          setCustomerResults(Array.isArray(data) ? data : []);
        }
      } catch (_) {
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerEmailSearch, selectedCustomer]);

  // Debounced Excluded Products search for global config
  useEffect(() => {
    if (!configProductSearch.trim()) {
      setConfigProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(configProductSearch.trim())}&limit=8`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.products || [];
          setConfigProductResults(items);
        }
      } catch (_) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [configProductSearch]);

  const getDefaultExpiryDate = (days = 60) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const handleGenerateCode = async () => {
    try {
      const res = await fetch('/api/admin/vouchers/generate-code', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.code) {
        setFormData((prev) => ({ ...prev, code: data.code }));
      }
    } catch (_) {}
  };

  const handleOpenCreateModal = async () => {
    setEditingVoucher(null);
    setSelectedCustomer(null);
    setCustomerEmailSearch('');
    setCustomerResults([]);
    const defaultTier = tiers.find((t) => t.amount === 1000) || tiers[0] || { amount: 1000, minCart: 15000 };
    setFormData({
      code: '',
      amount: defaultTier.amount,
      isCustomAmount: false,
      minimum_order_amount: defaultTier.minCart,
      reason: 'Produit manquant / incomplet',
      has_expiry: true,
      expires_at: getDefaultExpiryDate(60),
      allow_promo_stacking: globalAllowStacking,
      excluded_product_ids: [],
    });
    setIsModalOpen(true);
    handleGenerateCode();
  };

  const handleOpenEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setSelectedCustomer({
      id: voucher.user_id,
      email: voucher.user_email,
      full_name: voucher.user_name || 'Client ZORANDO',
      phone: '',
      wilaya: '',
      commune: '',
      orders_count: 0,
      active_vouchers_count: 0,
    });
    const isPreset = tiers.some((t) => Number(t.amount) === Number(voucher.amount));
    setFormData({
      code: voucher.code,
      amount: Number(voucher.amount),
      isCustomAmount: !isPreset,
      minimum_order_amount: Number(voucher.minimum_order_amount),
      reason: voucher.reason || '',
      has_expiry: Boolean(voucher.expires_at),
      expires_at: voucher.expires_at ? new Date(voucher.expires_at).toISOString().slice(0, 10) : '',
      allow_promo_stacking: Boolean(voucher.allow_promo_stacking),
      excluded_product_ids: Array.isArray(voucher.excluded_product_ids) ? voucher.excluded_product_ids : [],
    });
    setIsModalOpen(true);
  };

  const handleSelectTier = (tier: VoucherTier) => {
    setFormData((prev) => ({
      ...prev,
      amount: tier.amount,
      minimum_order_amount: tier.minCart,
      isCustomAmount: false,
    }));
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher && !selectedCustomer) {
      toast.error('Veuillez rechercher et sélectionner le compte client bénéficiaire.');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Le montant du bon doit être supérieur à 0 DA.');
      return;
    }
    if (formData.minimum_order_amount > 0 && formData.amount >= formData.minimum_order_amount) {
      toast.error('Le montant du bon doit être inférieur au panier minimum requis.');
      return;
    }

    setIsSaving(true);
    try {
      const expiresAtIso =
        formData.has_expiry && formData.expires_at
          ? new Date(`${formData.expires_at}T23:59:59`).toISOString()
          : null;

      if (editingVoucher) {
        const res = await fetch(`/api/admin/vouchers/${editingVoucher.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            amount: Number(formData.amount),
            minimum_order_amount: Number(formData.minimum_order_amount),
            reason: formData.reason.trim(),
            expires_at: expiresAtIso,
            allow_promo_stacking: formData.allow_promo_stacking,
            excluded_product_ids: formData.excluded_product_ids,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification');
        toast.success(`Bon d'achat ${editingVoucher.code} mis à jour !`);
      } else {
        const res = await fetch('/api/admin/vouchers', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user_id: selectedCustomer!.id,
            code: formData.code.trim().toUpperCase(),
            amount: Number(formData.amount),
            minimum_order_amount: Number(formData.minimum_order_amount),
            reason: formData.reason.trim(),
            expires_at: expiresAtIso,
            allow_promo_stacking: formData.allow_promo_stacking,
            excluded_product_ids: formData.excluded_product_ids,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
        toast.success(`Bon d'achat ${data.code} attribué à ${selectedCustomer!.email} !`);
      }

      setIsModalOpen(false);
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCancelVoucher = async () => {
    if (!cancelModal.voucher) return;
    try {
      const res = await fetch(`/api/admin/vouchers/${cancelModal.voucher.id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: cancelModal.reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible d\'annuler ce bon');
      toast.success(`Bon ${cancelModal.voucher.code} annulé`);
      setCancelModal({ isOpen: false, voucher: null, reason: 'Annulé par l\'administrateur' });
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleOpenHistory = async (voucher?: Voucher) => {
    setHistoryTitle(voucher ? `Historique du bon ${voucher.code}` : 'Historique complet des bons d\'achat');
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const url = voucher
        ? `/api/admin/vouchers/history?voucher_id=${voucher.id}`
        : '/api/admin/vouchers/history';
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setHistoryEntries(data);
      } else {
        setHistoryEntries([]);
      }
    } catch (_) {
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveGlobalConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/vouchers/config', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tiers,
          allowPromoStacking: globalAllowStacking,
          defaultExcludedProductIds: globalExcludedProducts.map((p) => p.id),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur sauvegarde configuration');
      }
      toast.success('Paramètres des bons d\'achat enregistrés');
      setIsConfigModalOpen(false);
      fetchConfig();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code "${code}" copié !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: Voucher['status']) => {
    switch (status) {
      case 'available':
        return { label: 'Disponible', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'reserved':
        return { label: 'Réservé (commande)', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'used':
        return { label: 'Utilisé', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Check };
      case 'expired':
        return { label: 'Expiré', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle };
      case 'cancelled':
        return { label: 'Annulé', cls: 'bg-red-50 text-red-700 border-red-200', icon: Ban };
      default:
        return { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle };
    }
  };

  const getHistoryActionLabel = (action: string) => {
    switch (action) {
      case 'issued': return { label: 'Attribué', cls: 'bg-emerald-100 text-emerald-800' };
      case 'updated': return { label: 'Modifié', cls: 'bg-blue-100 text-blue-800' };
      case 'reserved': return { label: 'Réservé (commande)', cls: 'bg-amber-100 text-amber-800' };
      case 'used': return { label: 'Consommé (validé)', cls: 'bg-purple-100 text-purple-800' };
      case 'released': return { label: 'Libéré (annulation)', cls: 'bg-teal-100 text-teal-800' };
      case 'cancelled': return { label: 'Annulé admin', cls: 'bg-red-100 text-red-800' };
      case 'expired': return { label: 'Expiré', cls: 'bg-gray-200 text-gray-700' };
      default: return { label: action, cls: 'bg-gray-100 text-gray-700' };
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.code.toLowerCase().includes(q) ||
      v.user_email.toLowerCase().includes(q) ||
      (v.user_name && v.user_name.toLowerCase().includes(q)) ||
      (v.order_ref && v.order_ref.toLowerCase().includes(q)) ||
      (v.reason && v.reason.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;

    const amt = Number(v.amount);
    if (amountFilter === '500' && amt !== 500) return false;
    if (amountFilter === '1000' && amt !== 1000) return false;
    if (amountFilter === '2000' && amt !== 2000) return false;
    if (amountFilter === 'custom' && [500, 1000, 2000].includes(amt)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Ticket size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Gestion des bons d'achat</h1>
            <p className="text-xs text-gray-500">
              Attribuez des bons de compensation nominatifs liés aux comptes clients ZORANDO
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchVouchers}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleOpenHistory()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs transition"
          >
            <History size={15} />
            <span>Historique</span>
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs transition"
          >
            <Settings2 size={15} />
            <span>Barème & Règles</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition shadow-sm shadow-orange-500/20"
          >
            <Plus size={16} />
            <span>Attribuer un bon</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <Ticket size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-semibold">Bons émis</div>
            <div className="text-xl font-black text-gray-900">{stats.total_issued}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-semibold">Bons utilisés</div>
            <div className="text-xl font-black text-blue-600">{stats.total_used}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-semibold">Bons disponibles</div>
            <div className="text-xl font-black text-emerald-600">{stats.total_available}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Coins size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-semibold">Valeur totale émise</div>
            <div className="text-lg font-black text-gray-900">{formatPrice(stats.total_issued_value)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 font-semibold">Valeur réellement utilisée</div>
            <div className="text-lg font-black text-purple-600">{formatPrice(stats.total_used_value)}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email, code, nom, motif..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'available', label: 'Disponibles' },
                { id: 'reserved', label: 'Réservés' },
                { id: 'used', label: 'Utilisés' },
                { id: 'expired', label: 'Expirés' },
                { id: 'cancelled', label: 'Annulés' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                    statusFilter === t.id ? 'bg-[#FF6B00] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Amount Filter */}
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-[#FF6B00]"
            >
              <option value="all">Tous montants</option>
              <option value="500">500 DA</option>
              <option value="1000">1 000 DA</option>
              <option value="2000">2 000 DA</option>
              <option value="custom">Personnalisés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#FF6B00]" />
            <p className="text-sm">Chargement des bons d'achat...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto mb-3">
              <Ticket size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Aucun bon d'achat trouvé</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'all' || amountFilter !== 'all'
                ? 'Aucun bon ne correspond à ces critères.'
                : 'Attribuez votre premier bon d\'achat commercial à un client.'}
            </p>
            {!(searchTerm || statusFilter !== 'all' || amountFilter !== 'all') && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Attribuer un bon d'achat
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Client bénéficiaire</th>
                  <th className="py-3 px-4 text-right">Valeur</th>
                  <th className="py-3 px-4 text-right">Panier min.</th>
                  <th className="py-3 px-4">Motif</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVouchers.map((v) => {
                  const badge = getStatusBadge(v.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-xs text-gray-900 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(v.code)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                            title="Copier le code"
                          >
                            {copiedCode === v.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {v.order_ref && (
                          <div className="text-[11px] text-gray-500 font-mono mt-1">
                            Cmd: <span className="font-bold text-gray-800">{v.order_ref}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-xs">{v.user_name || 'Client ZORANDO'}</div>
                        <div className="text-xs text-gray-500">{v.user_email}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]" title={v.user_id}>
                          ID: {v.user_id.slice(0, 8)}…
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-[#FF6B00] whitespace-nowrap">
                        {formatPrice(v.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-gray-700 text-xs whitespace-nowrap">
                        {Number(v.minimum_order_amount) > 0 ? formatPrice(v.minimum_order_amount) : 'Aucun'}
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="text-xs text-gray-700 line-clamp-2" title={v.reason || ''}>
                          {v.reason || 'Geste commercial'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {v.expires_at ? (
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar size={12} className="text-gray-400" />
                            {new Date(v.expires_at).toLocaleDateString('fr-FR')}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Illimitée</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenHistory(v)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Historique du bon"
                          >
                            <History size={15} />
                          </button>
                          {v.status === 'available' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(v)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() =>
                                  setCancelModal({ isOpen: true, voucher: v, reason: 'Annulé par l\'administrateur' })
                                }
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Annuler ce bon"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <Ticket size={18} />
                </div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  {editingVoucher ? `Modifier le bon ${editingVoucher.code}` : 'Attribuer un bon d\'achat client'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Step 1: Client lookup */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  1. Compte client bénéficiaire *
                </label>

                {selectedCustomer ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <UserCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 truncate">{selectedCustomer.full_name}</div>
                        <div className="text-xs text-gray-700 truncate">{selectedCustomer.email}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                          ID: {selectedCustomer.id}
                          {selectedCustomer.phone ? ` • Tél: ${selectedCustomer.phone}` : ''}
                          {!editingVoucher && ` • ${selectedCustomer.orders_count} cmd(s)`}
                        </div>
                      </div>
                    </div>
                    {!editingVoucher && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerEmailSearch('');
                        }}
                        className="text-xs font-bold text-red-600 hover:bg-white px-2.5 py-1 rounded-lg transition"
                      >
                        Changer
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={customerEmailSearch}
                        onChange={(e) => setCustomerEmailSearch(e.target.value)}
                        placeholder="Rechercher par adresse email client (ex: client@gmail.com)..."
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00]"
                      />
                    </div>
                    {isSearchingCustomer && <p className="text-xs text-gray-400">Recherche du compte existant...</p>}
                    {!isSearchingCustomer && customerEmailSearch.trim().length >= 2 && customerResults.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Aucun compte client enregistré trouvé pour « {customerEmailSearch} ».
                      </p>
                    )}
                    {customerResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerEmailSearch('');
                              setCustomerResults([]);
                            }}
                            className="w-full p-3 text-left hover:bg-orange-50/70 transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{c.full_name}</div>
                              <div className="text-xs text-gray-600 truncate">{c.email}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                ID: {c.id.slice(0, 14)}… • {c.orders_count} commande(s)
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#FF6B00] shrink-0">Sélectionner</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Barème & Montants */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Valeur du bon d'achat & Panier minimum *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tiers.map((t) => {
                    const selected = !formData.isCustomAmount && Number(formData.amount) === Number(t.amount);
                    return (
                      <button
                        key={t.amount}
                        type="button"
                        onClick={() => handleSelectTier(t)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          selected
                            ? 'border-[#FF6B00] bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-black text-gray-900">{t.amount.toLocaleString('fr-FR')} DA</div>
                        <div className="text-[10px] text-gray-500">Min: {t.minCart.toLocaleString('fr-FR')} DA</div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isCustomAmount: true }))}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      formData.isCustomAmount
                        ? 'border-[#FF6B00] bg-orange-50 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-gray-900">Personnalisé</div>
                    <div className="text-[10px] text-gray-500">Montant libre</div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Montant du bon (DA) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: Math.max(0, Number(e.target.value) || 0),
                          isCustomAmount: !tiers.some((t) => t.amount === Number(e.target.value)),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:border-[#FF6B00] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Panier minimum produits (DA, hors livraison) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formData.minimum_order_amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          minimum_order_amount: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:border-[#FF6B00] outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Le minimum s'applique exclusivement aux produits éligibles. Les frais de livraison restent toujours à part.
                </p>
              </div>

              {/* Step 3: Code & Motif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Code unique *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      readOnly={Boolean(editingVoucher)}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))
                      }
                      className={`w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded-xl uppercase ${
                        editingVoucher ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    />
                    {!editingVoucher && (
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 shrink-0"
                        title="Générer un nouveau code"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Expiration</label>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_expiry}
                        onChange={(e) => setFormData((prev) => ({ ...prev, has_expiry: e.target.checked }))}
                        className="rounded text-[#FF6B00]"
                      />
                      <span>Limiter</span>
                    </label>
                  </div>
                  {formData.has_expiry ? (
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      required={formData.has_expiry}
                      value={formData.expires_at}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expires_at: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:border-[#FF6B00] outline-none"
                    />
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-400 italic border border-gray-200 rounded-xl bg-gray-50">
                      Sans date d'expiration
                    </div>
                  )}
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Motif d'attribution
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, reason: r }))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                        formData.reason === r
                          ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00] font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Compensation suite à accessoire manquant sur commande CMD-1024..."
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#FF6B00] outline-none"
                />
              </div>

              {/* Promo stacking option */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">Autoriser le cumul avec un code promo</div>
                  <div className="text-[11px] text-gray-500">Désactivé par défaut pour préserver les marges</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_promo_stacking}
                  onChange={(e) => setFormData((prev) => ({ ...prev, allow_promo_stacking: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#FF6B00]"
                />
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : editingVoucher ? 'Mettre à jour' : 'Attribuer le bon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModal.isOpen && cancelModal.voucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900">Annuler le bon {cancelModal.voucher.code} ?</h3>
                <p className="text-xs text-gray-500">
                  Client : {cancelModal.voucher.user_email} ({formatPrice(cancelModal.voucher.amount)})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Raison de l'annulation</label>
              <input
                type="text"
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModal({ isOpen: false, voucher: null, reason: '' })}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Fermer
              </button>
              <button
                onClick={handleConfirmCancelVoucher}
                className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIG MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <Settings2 size={18} className="text-[#FF6B00]" /> Barème & Règles globales des bons d'achat
              </h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Barème par défaut (Valeur bon → Panier minimum)
                </h4>
                <div className="space-y-2">
                  {tiers.map((tier, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[10px] text-gray-500">Valeur bon (DA)</label>
                        <input
                          type="number"
                          value={tier.amount}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[idx] = { ...tier, amount: Number(e.target.value) || 0 };
                            setTiers(next);
                          }}
                          className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Panier minimum produits (DA)</label>
                        <input
                          type="number"
                          value={tier.minCart}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[idx] = { ...tier, minCart: Number(e.target.value) || 0 };
                            setTiers(next);
                          }}
                          className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">Cumul par défaut avec codes promo</div>
                  <div className="text-[11px] text-gray-500">Recommandé : désactivé pour protéger vos marges</div>
                </div>
                <input
                  type="checkbox"
                  checked={globalAllowStacking}
                  onChange={(e) => setGlobalAllowStacking(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6B00]"
                />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <PackageX size={14} className="text-red-500" /> Produits exclus des bons d'achat
                </h4>
                <input
                  type="text"
                  value={configProductSearch}
                  onChange={(e) => setConfigProductSearch(e.target.value)}
                  placeholder="Rechercher un produit à exclure (nom, SKU)..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
                {configProductResults.length > 0 && (
                  <div className="border border-gray-200 rounded-xl divide-y max-h-40 overflow-y-auto">
                    {configProductResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (!globalExcludedProducts.some((ex) => ex.id === p.id)) {
                            setGlobalExcludedProducts((prev) => [...prev, p]);
                          }
                          setConfigProductSearch('');
                          setConfigProductResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-orange-50 flex justify-between"
                      >
                        <span className="truncate font-semibold text-gray-800">{p.name}</span>
                        <span className="text-[#FF6B00] font-bold shrink-0 ml-2">+ Exclure</span>
                      </button>
                    ))}
                  </div>
                )}

                {globalExcludedProducts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {globalExcludedProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium"
                      >
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => setGlobalExcludedProducts((prev) => prev.filter((x) => x.id !== p.id))}
                          className="hover:text-red-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tous les produits du catalogue sont éligibles par défaut.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Fermer
              </button>
              <button
                onClick={handleSaveGlobalConfig}
                disabled={isSavingConfig}
                className="px-5 py-2 text-sm font-bold bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl disabled:opacity-50"
              >
                {isSavingConfig ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-[#FF6B00]" /> {historyTitle}
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {historyLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm">Chargement de l'historique...</div>
              ) : historyEntries.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Aucun événement enregistré.</div>
              ) : (
                historyEntries.map((h) => {
                  const lbl = getHistoryActionLabel(h.action);
                  return (
                    <div key={h.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lbl.cls}`}>{lbl.label}</span>
                          <span className="font-mono font-bold text-xs text-gray-900">{h.code}</span>
                          {h.order_ref && (
                            <span className="text-xs font-mono text-gray-600">• {h.order_ref}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Client : <span className="font-medium text-gray-800">{h.user_email}</span> • Acteur :{' '}
                          <span className="font-mono text-[11px]">{h.actor_id}</span>
                        </div>
                        {h.details?.reason && (
                          <div className="text-[11px] text-gray-500 italic">« {h.details.reason} »</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {h.amount != null && (
                          <div className="text-xs font-black text-gray-900">{formatPrice(h.amount)}</div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(h.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
