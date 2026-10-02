import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { 
  Package, 
  Search, 
  ChevronRight, 
  ExternalLink, 
  X, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders/user/${user.id}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => 
    (order.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'livrée') {
      return {
        label: 'Livrée',
        bg: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle2
      };
    }
    if (s === 'cancelled' || s === 'annulée') {
      return {
        label: 'Annulée',
        bg: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertCircle
      };
    }
    if (s === 'shipped' || s === 'expédiée') {
      return {
        label: 'Expédiée',
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Truck
      };
    }
    return {
      label: s === 'nouvelle' ? 'En préparation' : status || 'En cours',
      bg: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Clock
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Mes Commandes</h2>
          <p className="text-gray-500 text-sm mt-0.5">Suivez l'état et l'historique de vos achats.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par n° de commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full sm:w-72 transition-all bg-gray-50/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
          ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;

            return (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:scale-105 transition-transform shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-gray-900 text-base group-hover:text-orange-600 transition-colors">
                          Commande {order.order_id || `#${order.id}`}
                        </h4>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:text-right gap-4 md:gap-8 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Total à payer</p>
                      <p className="text-lg font-black text-orange-600">{formatPrice(order.total_amount)}</p>
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="p-2.5 border border-gray-200 rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 text-gray-500 transition-all shadow-sm group-hover:translate-x-1"
                      title="Voir les détails de la commande"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Footer preview */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{order.items?.length || 0} article(s)</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">
                      {order.stop_desk ? 'Point Relais' : 'Livraison à domicile'} ({order.wilaya})
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-orange-600 font-bold group-hover:underline">
                    <span>Afficher les détails</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white w-20 h-20 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Package className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Aucune commande trouvée</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
              Vous n'avez pas encore passé de commande ou votre recherche ne correspond à aucun achat.
            </p>
            <Link 
              to="/" 
              className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-extrabold text-sm rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
            >
              <span>Commencer mes achats</span>
            </Link>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6 md:p-8 animate-scale-up space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-gray-900">
                    Commande {selectedOrder.order_id || `#${selectedOrder.id}`}
                  </h3>
                  {(() => {
                    const badge = getStatusBadge(selectedOrder.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1 ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Passée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Articles Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />
                <span>Articles commandés ({selectedOrder.items?.length || 0})</span>
              </h4>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
                      <img 
                        src={item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=100`}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-gray-900 line-clamp-2">{item.name}</h5>
                        {item.variation && (
                          <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-1">
                            {item.variation}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-sm text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-xs text-gray-500 italic">Détails des articles indisponibles</p>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-500" />
                <span>Informations de livraison</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedOrder.customer_name || 'Client'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="text-gray-500 pl-5">
                      {selectedOrder.customer_email}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-gray-900 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span>{selectedOrder.wilaya} — {selectedOrder.commune}</span>
                      <p className="text-gray-600 font-normal mt-0.5">
                        {selectedOrder.stop_desk 
                          ? `Point relais : ${selectedOrder.office_name || 'Bureau de retrait'}` 
                          : selectedOrder.address}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOrder.note && (
                  <div className="col-span-full pt-2 border-t border-gray-200/60 flex items-start gap-2 text-gray-600">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span><strong>Note pour le livreur :</strong> {selectedOrder.note}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/30 p-5 rounded-2xl border border-orange-100 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Frais de livraison ({selectedOrder.stop_desk ? 'Point Relais' : 'À domicile'})</span>
                <span className="font-bold text-gray-800">
                  {Number(selectedOrder.delivery_cost) === 0 ? 'Gratuit' : formatPrice(selectedOrder.delivery_cost)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Mode de paiement</span>
                <span className="font-bold text-gray-800">Paiement à la livraison (Espèces)</span>
              </div>
              <div className="border-t border-orange-200/70 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-gray-900">Montant total</span>
                <span className="text-2xl font-black text-orange-600">
                  {formatPrice(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition-colors text-center"
              >
                Fermer
              </button>
              <Link
                to="/"
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all text-center shadow-md shadow-orange-200 flex items-center justify-center gap-1.5"
              >
                <span>Faire de nouveaux achats</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
