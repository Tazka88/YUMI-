import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Tag, Plus, Search, RefreshCw, Edit, Trash2, Check, Copy, 
  AlertTriangle, Calendar, CheckCircle2, X, Package, Percent,
  TrendingUp, Clock, AlertCircle, ExternalLink, Power
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export interface PromoCode {
  id: number;
  code: string;
  product_id: number;
  discount_percent: number;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_sku?: string;
  product_price?: number;
  product_promo_price?: number | null;
  product_stock?: number;
  product_image?: string;
}

interface ProductSearchResult {
  id: number;
  name: string;
  sku?: string;
  price: number;
  promo_price?: number | null;
  stock: number;
  image?: string;
}

export default function PromoCodesAdmin() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    product_id: '',
    discount_percent: 10,
    usage_limit: 50,
    expires_at: '',
    has_expiry: false,
    is_active: true
  });

  // Product search inside modal
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Delete confirm modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    promo: PromoCode | null;
  }>({
    isOpen: false,
    promo: null
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Échec du chargement des codes promo');
      const data = await res.json();
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors du chargement des codes promo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  // Search catalog products for modal
  useEffect(() => {
    if (!productSearch.trim() || selectedProduct) {
      setProductResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(productSearch.trim())}&limit=8`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.products || [];
          setProductResults(items);
        }
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch, selectedProduct]);

  const handleOpenCreateModal = () => {
    setEditingPromo(null);
    setSelectedProduct(null);
    setProductSearch('');
    setProductResults([]);
    setFormData({
      code: '',
      product_id: '',
      discount_percent: 10,
      usage_limit: 50,
      expires_at: '',
      has_expiry: false,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setSelectedProduct({
      id: promo.product_id,
      name: promo.product_name || `Produit #${promo.product_id}`,
      sku: promo.product_sku,
      price: Number(promo.product_price) || 0,
      promo_price: promo.product_promo_price ? Number(promo.product_promo_price) : null,
      stock: promo.product_stock || 0,
      image: promo.product_image
    });
    setProductSearch('');
    setProductResults([]);

    let formattedDate = '';
    if (promo.expires_at) {
      const d = new Date(promo.expires_at);
      formattedDate = d.toISOString().slice(0, 10);
    }

    setFormData({
      code: promo.code,
      product_id: String(promo.product_id),
      discount_percent: promo.discount_percent,
      usage_limit: promo.usage_limit,
      expires_at: formattedDate,
      has_expiry: Boolean(promo.expires_at),
      is_active: promo.is_active
    });
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Le code promo est obligatoire');
      return;
    }
    if (!formData.product_id) {
      toast.error('Veuillez sélectionner un produit du catalogue');
      return;
    }
    if (formData.discount_percent < 1 || formData.discount_percent > 100) {
      toast.error('Le pourcentage doit être compris entre 1 et 100%');
      return;
    }
    if (formData.usage_limit < 1) {
      toast.error('La limite d\'utilisation doit être au minimum de 1');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        product_id: parseInt(formData.product_id, 10),
        discount_percent: Number(formData.discount_percent),
        usage_limit: Number(formData.usage_limit),
        expires_at: formData.has_expiry && formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active
      };

      let res;
      if (editingPromo) {
        res = await fetch(`/api/admin/promo-codes/${editingPromo.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/promo-codes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      toast.success(editingPromo ? 'Code promo mis à jour !' : 'Code promo créé avec succès !');
      setIsModalOpen(false);
      fetchPromoCodes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (promo: PromoCode) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Impossible de modifier le statut');
      }
      setPromoCodes(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`Code ${promo.code} ${!promo.is_active ? 'activé' : 'désactivé'}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.promo) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${deleteModal.promo.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossible de supprimer ce code');
      }
      toast.success('Code promo supprimé');
      setDeleteModal({ isOpen: false, promo: null });
      fetchPromoCodes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code "${code}" copié dans le presse-papier !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered list
  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = 
      promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promo.product_name && promo.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (promo.product_sku && promo.product_sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const isExpired = promo.expires_at ? new Date(promo.expires_at) < new Date() : false;

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return promo.is_active && !isExpired && promo.used_count < promo.usage_limit;
    if (statusFilter === 'inactive') return !promo.is_active;
    if (statusFilter === 'expired') return isExpired || promo.used_count >= promo.usage_limit;
    return true;
  });

  // Summary stats
  const totalCodes = promoCodes.length;
  const activeCodes = promoCodes.filter(p => {
    const isExpired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
    return p.is_active && !isExpired && p.used_count < p.usage_limit;
  }).length;
  const totalUses = promoCodes.reduce((sum, p) => sum + (Number(p.used_count) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Codes promo</h1>
              <p className="text-xs text-gray-500">
                Créez et gérez manuellement des codes promo rattachés à des produits spécifiques
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPromoCodes}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/80 transition shadow-xs"
            title="Rafraîchir la liste"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition shadow-sm shadow-orange-500/20"
          >
            <Plus size={16} />
            <span>Nouveau code promo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total des codes</div>
            <div className="text-2xl font-black text-gray-900 mt-0.5">{totalCodes}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Codes actifs</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{activeCodes}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Utilisations totales</div>
            <div className="text-2xl font-black text-purple-600 mt-0.5">{totalUses}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par code, produit, SKU..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'inactive', label: 'Inactifs' },
            { id: 'expired', label: 'Expirés / Épuisés' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-orange-500" />
            <p className="text-sm">Chargement des codes promo...</p>
          </div>
        ) : filteredPromoCodes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mx-auto mb-3">
              <Tag size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Aucun code promo trouvé</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun résultat ne correspond à votre filtre de recherche.'
                : 'Commencez par créer votre premier code promo pour récompenser vos clients.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="text-xs font-semibold text-orange-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                Créer un code promo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Code promo</th>
                  <th className="py-3 px-4">Produit rattaché</th>
                  <th className="py-3 px-4 text-center">Réduction</th>
                  <th className="py-3 px-4">Utilisation</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPromoCodes.map(promo => {
                  const isExpired = promo.expires_at ? new Date(promo.expires_at) < new Date() : false;
                  const isLimitReached = promo.used_count >= promo.usage_limit;
                  const usagePercent = Math.min(100, Math.round((promo.used_count / promo.usage_limit) * 100));

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50/60 transition group">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-gray-900 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(promo.code)}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition"
                            title="Copier le code"
                          >
                            {copiedCode === promo.code ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {promo.product_image ? (
                              <img 
                                src={promo.product_image} 
                                alt={promo.product_name || 'Produit'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={16} className="text-gray-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-gray-900 text-xs truncate" title={promo.product_name}>
                              {promo.product_name || `Produit #${promo.product_id}`}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                              {promo.product_sku && <span>SKU: {promo.product_sku}</span>}
                              {promo.product_price && (
                                <span className="font-semibold text-gray-700">
                                  {formatPrice(promo.product_promo_price || promo.product_price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700 border border-orange-200">
                          -{promo.discount_percent}%
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-gray-900 font-mono">
                            {promo.used_count} <span className="text-gray-400 font-normal">/ {promo.usage_limit}</span>
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">{usagePercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isLimitReached ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        {isLimitReached && (
                          <span className="text-[10px] text-red-600 font-medium block mt-0.5">Limite atteinte</span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 px-4 text-xs">
                        {promo.expires_at ? (
                          <div className="space-y-0.5">
                            <div className={`font-medium flex items-center gap-1 ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                              <Calendar size={12} className={isExpired ? 'text-red-500' : 'text-gray-400'} />
                              {new Date(promo.expires_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            {isExpired && (
                              <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                Expiré
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Illimitée</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(promo)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            promo.is_active ? 'bg-emerald-500' : 'bg-gray-200'
                          }`}
                          title={promo.is_active ? 'Désactiver le code' : 'Activer le code'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              promo.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier ce code"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, promo })}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer ce code"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Tag size={18} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  {editingPromo ? 'Modifier le code promo' : 'Créer un code promo'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePromo} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Code promo *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="Ex: RETOUR10, SUMMER20, FIDELITE15"
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Le client saisira ce code exact dans son panier.
                </p>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Produit associé *
                </label>

                {selectedProduct ? (
                  <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-white border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {selectedProduct.image ? (
                          <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-orange-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-gray-900 truncate">{selectedProduct.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Prix : <span className="font-semibold text-orange-600">{formatPrice(selectedProduct.promo_price || selectedProduct.price)}</span>
                          {selectedProduct.sku && ` • SKU: ${selectedProduct.sku}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setFormData({ ...formData, product_id: '' });
                      }}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white transition shrink-0"
                      title="Changer de produit"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Rechercher un produit du catalogue (nom, SKU)..."
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    {isSearchingProducts && (
                      <p className="text-xs text-gray-400 italic">Recherche dans le catalogue...</p>
                    )}

                    {productResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-xs">
                        {productResults.map(p => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setFormData({ ...formData, product_id: String(p.id) });
                              setProductSearch('');
                              setProductResults([]);
                            }}
                            className="w-full p-2.5 flex items-center gap-3 hover:bg-orange-50/60 transition text-left"
                          >
                            <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={16} className="text-gray-400 m-auto mt-2" />
                              )}
                            </div>
                            <div className="truncate flex-1">
                              <div className="text-xs font-semibold text-gray-900 truncate">{p.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">
                                {formatPrice(p.promo_price || p.price)} {p.sku && `• ${p.sku}`}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-orange-600 shrink-0">Choisir</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  La réduction s'appliquera exclusivement au montant de cet article.
                </p>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Pourcentage de réduction (%) *
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
                      className="w-full px-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 pr-8"
                      required
                    />
                    <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {/* Preset pills */}
                  <div className="flex items-center gap-1">
                    {[10, 15, 20, 30, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFormData({ ...formData, discount_percent: pct })}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          formData.discount_percent === pct
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Limite maximale d'utilisations *
                </label>
                <input
                  type="number"
                  min={editingPromo ? Math.max(1, editingPromo.used_count) : 1}
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Nombre total de fois où ce code peut être consommé (tous clients confondus).
                  {editingPromo && editingPromo.used_count > 0 && (
                    <span className="text-amber-600 block mt-0.5">
                      Déjà utilisé {editingPromo.used_count} fois.
                    </span>
                  )}
                </p>
              </div>

              {/* Expiration Date */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date d'expiration
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.has_expiry}
                      onChange={(e) => setFormData({ ...formData, has_expiry: e.target.checked })}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span>Activer une date limite</span>
                  </label>
                </div>

                {formData.has_expiry && (
                  <input
                    type="date"
                    value={formData.expires_at}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required={formData.has_expiry}
                  />
                )}
              </div>

              {/* Active Toggle */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800">Activer immédiatement</div>
                  <div className="text-[11px] text-gray-400">Le code sera utilisable dès maintenant par les clients</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow-sm shadow-orange-500/20 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw size={14} className="animate-spin" />}
                  <span>{editingPromo ? 'Enregistrer les modifications' : 'Créer le code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.promo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">
              Supprimer le code promo {deleteModal.promo.code} ?
            </h3>

            {Number(deleteModal.promo.used_count) > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-4 leading-relaxed">
                <strong>Attention :</strong> Ce code promo a déjà été utilisé {deleteModal.promo.used_count} fois. Pour préserver l'historique de vos commandes et de votre comptabilité, vous ne pouvez pas le supprimer définitivement. Vous devez plutôt le <strong>désactiver</strong>.
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Cette action supprimera définitivement le code promo <strong>{deleteModal.promo.code}</strong>. Aucun client ne pourra plus l'utiliser.
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, promo: null })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Annuler
              </button>

              {Number(deleteModal.promo.used_count) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(deleteModal.promo!);
                    setDeleteModal({ isOpen: false, promo: null });
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Power size={14} />
                  Désactiver plutôt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Supprimer définitivement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
