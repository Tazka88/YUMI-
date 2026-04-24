import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Package, Search, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders/user/${user.uid}`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Commandes</h2>
          <p className="text-gray-500 text-sm">Suivez et gérez vos achats récents.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full sm:w-64 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>)
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Commande {order.order_id || `#${order.id}`}</h4>
                    <p className="text-xs text-gray-500 mt-1">Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="flex items-center mt-2 space-x-2">
                       <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:text-right gap-4 md:gap-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total</p>
                    <p className="text-lg font-black text-gray-900">{formatPrice(order.total_amount)}</p>
                  </div>
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-2 text-xs font-medium text-gray-600">
                <span>{order.items?.length || 0} article(s)</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center text-orange-600 hover:underline cursor-pointer">
                  Détails <ExternalLink className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white w-20 h-20 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Aucune commande trouvée</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">Vous n'avez pas encore passé de commande ou votre recherche ne correspond à rien.</p>
            <Link to="/" className="mt-8 inline-flex items-center px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200">
              Commencer mes achats
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
