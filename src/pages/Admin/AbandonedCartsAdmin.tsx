import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ShoppingBag, Search, RefreshCw, MessageSquare, Phone, 
  ExternalLink, Copy, Check, Clock, AlertTriangle, 
  CheckCircle2, X, ChevronLeft, ChevronRight, Eye, 
  Trash2, User, MapPin, Mail, ArrowUpRight
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  promo_price: number | null;
  quantity: number;
  image: string;
  selectedVariation?: any;
  cartItemId?: string;
}

interface Cart {
  id: string;
  session_id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  wilaya: string | null;
  commune: string | null;
  items: CartItem[];
  total_estimated: number;
  item_count: number;
  status: 'active' | 'abandoned' | 'converted';
  order_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_phone?: string;
  profile_email?: string;
  profile_wilaya?: string;
}

interface CartStats {
  activeCount: number;
  abandonedCount: number;
  abandonedTotalValue: number;
  convertedCount: number;
}

export default function AbandonedCartsAdmin() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [stats, setStats] = useState<CartStats>({
    activeCount: 0,
    abandonedCount: 0,
    abandonedTotalValue: 0,
    convertedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'abandoned' | 'active' | 'converted'>('abandoned');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [recoveryLang, setRecoveryLang] = useState<'fr' | 'ar'>('fr');
  const [copied, setCopied] = useState(false);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '20');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/admin/carts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Erreur lors du chargement des paniers');

      const data = await res.json();
      setCarts(data.carts || []);
      setStats(data.stats || { activeCount: 0, abandonedCount: 0, abandonedTotalValue: 0, convertedCount: 0 });
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Impossible de récupérer les paniers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCarts();
  };

  const handleDeleteCart = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet enregistrement de panier ?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/carts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Échec de suppression');
      toast.success('Panier supprimé avec succès');
      if (selectedCart?.id === id) setSelectedCart(null);
      fetchCarts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Helper to get formatted contact phone
  const getCleanPhone = (cart: Cart): string | null => {
    const raw = cart.customer_phone || cart.profile_phone;
    if (!raw) return null;
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '213' + digits.substring(1);
    if (digits.startsWith('213') && digits.length >= 11) return digits;
    if (digits.length === 9) return '213' + digits;
    return digits.length >= 9 ? digits : null;
  };

  const getCustomerDisplayName = (cart: Cart): string => {
    if (cart.customer_name?.trim()) return cart.customer_name.trim();
    if (cart.profile_first_name || cart.profile_last_name) {
      return `${cart.profile_first_name || ''} ${cart.profile_last_name || ''}`.trim();
    }
    return 'Visiteur anonyme';
  };

  // Generate recovery text
  const generateRecoveryMessage = (cart: Cart, lang: 'fr' | 'ar') => {
    const name = getCustomerDisplayName(cart);
    const firstItem = cart.items && cart.items.length > 0 ? cart.items[0].name : 'vos articles';
    const itemsCount = cart.items ? cart.items.length : 0;
    const additional = itemsCount > 1 ? ` et ${itemsCount - 1} autre(s) article(s)` : '';
    const recoveryUrl = 'https://www.zorando.com/cart';

    if (lang === 'ar') {
      return `سلام عليكم ${name !== 'Visiteur anonyme' ? name : ''} !
لقد أضفت « ${firstItem}${additional} » إلى سلتك على متجر ZORANDO ولكن لم يتم تأكيد الطلب.
إذا كنت ما زلت مهتماً، سنوفر لك توصيلاً سريعاً إلى 58 ولاية مع الدفع عند الاستلام.
يمكنك إكمال طلبك مباشرة عبر الرابط التالي:
${recoveryUrl}
شكراً لثقتك بنا في ZORANDO !`;
    }

    return `Bonjour ${name !== 'Visiteur anonyme' ? name : ''} !
Vous avez ajouté « ${firstItem}${additional} » à votre panier sur ZORANDO, mais votre commande ne semble pas avoir été finalisée.
Retrouvez vos articles sur notre site et finalisez votre commande avec la livraison rapide dans les 58 wilayas et le paiement à la réception :
${recoveryUrl}
Merci pour votre confiance sur ZORANDO !`;
  };

  const handleCopyMessage = (cart: Cart) => {
    const msg = generateRecoveryMessage(cart, recoveryLang);
    navigator.clipboard.writeText(msg);
    setCopied(true);
    toast.success('Message de relance copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppLink = (cart: Cart) => {
    const phone = getCleanPhone(cart);
    if (!phone) return null;
    const msg = encodeURIComponent(generateRecoveryMessage(cart, recoveryLang));
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Il y a ${Math.max(1, diffMins)} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Paniers Abandonnés</h1>
              <p className="text-sm text-gray-500">
                Suivez et relancez les clients qui ajoutent des produits sans finaliser leur commande.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchCarts()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Abandoned Carts */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Paniers Abandonnés</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.abandonedCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Inactifs depuis &gt; 60 min</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
        </div>

        {/* Total Value of Abandoned */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Valeur Potentielle</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{formatPrice(stats.abandonedTotalValue)}</h3>
              <p className="text-xs text-gray-400 mt-1">Chiffre d'affaires à récupérer</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400" />
        </div>

        {/* Active Carts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Paniers Actifs</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.activeCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Activité récente (&lt; 60 min)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Converted Carts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Paniers Convertis</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.convertedCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Commandes terminées</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => { setStatusFilter('abandoned'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'abandoned'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Abandonnés ({stats.abandonedCount})
          </button>
          <button
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Actifs ({stats.activeCount})
          </button>
          <button
            onClick={() => { setStatusFilter('converted'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'converted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Convertis ({stats.convertedCount})
          </button>
          <button
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tous les paniers
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Rechercher client, tél, article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Chargement des paniers...</p>
          </div>
        ) : carts.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">Aucun panier trouvé</h3>
            <p className="text-gray-500 text-sm mt-1">
              {statusFilter === 'abandoned'
                ? 'Aucun panier abandonné pour le moment.'
                : 'Aucun enregistrement ne correspond à vos filtres.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="py-3.5 px-4">Activité</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Articles</th>
                  <th className="py-3.5 px-4">Total Estimé</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {carts.map((cart) => {
                  const phone = getCleanPhone(cart);
                  const isAbandoned = cart.status === 'abandoned';
                  const isConverted = cart.status === 'converted';
                  const customerName = getCustomerDisplayName(cart);
                  const wilaya = cart.wilaya || cart.profile_wilaya;

                  return (
                    <tr key={cart.id} className="hover:bg-orange-50/20 transition">
                      {/* Last Activity */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{formatActivityTime(cart.last_activity_at)}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {new Date(cart.last_activity_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{customerName}</span>
                        </div>
                        {wilaya && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{wilaya} {cart.commune ? `(${cart.commune})` : ''}</span>
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {phone ? (
                          <div className="space-y-1">
                            <a
                              href={`tel:${phone}`}
                              className="font-mono text-xs font-semibold text-gray-800 hover:text-orange-600 flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" />
                              {cart.customer_phone || cart.profile_phone}
                            </a>
                            {(cart.customer_email || cart.profile_email) && (
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[140px]">{cart.customer_email || cart.profile_email}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400">Non renseigné</span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {cart.items && cart.items.length > 0 && cart.items[0].image && (
                            <img
                              src={cart.items[0].image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 max-w-[220px]">
                            <div className="font-medium text-gray-800 truncate text-xs">
                              {cart.items && cart.items.length > 0 ? cart.items[0].name : 'Panier vide'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cart.item_count} article{cart.item_count > 1 ? 's' : ''}
                              {cart.items && cart.items.length > 1 && (
                                <span className="text-orange-600 font-semibold ml-1">
                                  (+{cart.items.length - 1} autre{cart.items.length > 2 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Estimated Total */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-gray-900 text-sm">
                          {formatPrice(cart.total_estimated)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {cart.order_id || 'Converti'}
                          </span>
                        ) : isAbandoned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Abandonné
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            <Clock className="w-3.5 h-3.5" />
                            Actif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp recovery button */}
                          {phone && isAbandoned && (
                            <a
                              href={getWhatsAppLink(cart) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition shadow-sm"
                              title="Relancer sur WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}

                          {/* Detail button */}
                          <button
                            onClick={() => setSelectedCart(cart)}
                            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white transition shadow-sm"
                            title="Voir les détails du panier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCart(cart.id)}
                            className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Supprimer ce panier"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {currentPage} sur {totalPages} ({totalCount} paniers)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart Detail & Recovery Modal */}
      {selectedCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-gray-900">Détails du Panier</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedCart.status === 'converted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedCart.status === 'abandoned'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedCart.status === 'converted' ? `Converti (${selectedCart.order_id})` : selectedCart.status === 'abandoned' ? 'Abandonné' : 'Actif'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ID: <span className="font-mono">{selectedCart.id}</span> • Dernière activité : {new Date(selectedCart.last_activity_at).toLocaleString('fr-FR')}
                </p>
              </div>

              <button
                onClick={() => setSelectedCart(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Informations Client</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Nom :</span>
                    <span className="font-bold text-gray-800">{getCustomerDisplayName(selectedCart)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Téléphone :</span>
                    {getCleanPhone(selectedCart) ? (
                      <a href={`tel:${getCleanPhone(selectedCart)}`} className="font-mono font-bold text-orange-600 hover:underline">
                        {selectedCart.customer_phone || selectedCart.profile_phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Non disponible</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Wilaya / Commune :</span>
                    <span className="font-medium text-gray-800">
                      {selectedCart.wilaya || selectedCart.profile_wilaya || 'Non spécifiée'} {selectedCart.commune ? `(${selectedCart.commune})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">E-mail :</span>
                    <span className="font-medium text-gray-800">
                      {selectedCart.customer_email || selectedCart.profile_email || 'Non spécifié'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Articles dans le panier ({selectedCart.item_count})
                </h4>
                <div className="space-y-2 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedCart.items.map((item, idx) => {
                    const price = (item.promo_price && item.promo_price > 0 && item.promo_price < item.price)
                      ? item.promo_price
                      : item.price;
                    return (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <a
                              href={`/product/${item.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-xs text-gray-900 hover:text-orange-600 flex items-center gap-1"
                            >
                              {item.name}
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </a>
                            {item.selectedVariation && (
                              <p className="text-[11px] text-gray-500">
                                {item.selectedVariation.attribute} : {item.selectedVariation.value}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.quantity} × {formatPrice(price)}
                            </p>
                          </div>
                        </div>
                        <div className="font-black text-gray-900 text-sm text-right">
                          {formatPrice(price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-3 px-2">
                  <span className="text-sm font-semibold text-gray-500">Total estimé :</span>
                  <span className="text-xl font-black text-orange-600">{formatPrice(selectedCart.total_estimated)}</span>
                </div>
              </div>

              {/* Recovery Section */}
              <div className="p-5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-orange-950 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    Relance Client
                  </h4>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-orange-200 text-xs font-bold">
                    <button
                      onClick={() => setRecoveryLang('fr')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        recoveryLang === 'fr' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Français
                    </button>
                    <button
                      onClick={() => setRecoveryLang('ar')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        recoveryLang === 'ar' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      الدارجة
                    </button>
                  </div>
                </div>

                {/* Preview Message */}
                <div className="bg-white p-3.5 rounded-xl border border-orange-100 text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {generateRecoveryMessage(selectedCart, recoveryLang)}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyMessage(selectedCart)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-orange-300 bg-white hover:bg-orange-50 text-orange-700 font-bold text-xs transition shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié !' : 'Copier le message'}
                  </button>

                  {getCleanPhone(selectedCart) ? (
                    <a
                      href={getWhatsAppLink(selectedCart) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Envoyer sur WhatsApp
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed"
                    >
                      Numéro non disponible
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
