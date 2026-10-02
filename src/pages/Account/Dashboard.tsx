import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Package, Heart, MapPin, ChevronRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch from SQL database via API
        const response = await fetch(`/api/orders/user/${user.id}`);
        const orders = await response.json();
        
        if (Array.isArray(orders)) {
          setRecentOrders(orders.slice(0, 3));
          setOrderStats({
            total: orders.length,
            pending: orders.filter((o: any) => o.status === 'pending').length,
            delivered: orders.filter((o: any) => o.status === 'delivered').length
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const stats = [
    { label: 'Total Commandes', value: orderStats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'En attente', value: orderStats.pending, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Livrées', value: orderStats.delivered, icon: ChevronRight, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenue, {profile?.first_name || profile?.firstName || user?.user_metadata?.first_name || 'Client'} !</h2>
        <p className="text-gray-500 mt-1">Ravie de vous revoir. Voici un aperçu de votre compte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Commandes récentes</h3>
            <Link to="/account/orders" className="text-sm font-medium text-orange-600 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl"></div>)
            ) : recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{order.order_id || `#${order.id}`}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune commande pour le moment.</p>
                <Link to="/" className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline">Commencer mes achats</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links / Account Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Informations & Raccourcis</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-orange-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" /> Adresse par défaut
                </h4>
                <p className="text-sm text-orange-800 mt-2 line-clamp-2">
                  {profile?.full_address || profile?.fullAddress || "Aucune adresse enregistrée."}
                </p>
                <Link to="/account/addresses" className="mt-4 inline-flex items-center text-xs font-bold text-orange-700 uppercase tracking-wider group-hover:underline">
                  Modifier <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <MapPin className="w-32 h-32 text-orange-900" />
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-blue-900 flex items-center">
                  <Heart className="w-5 h-5 mr-2" /> Liste d'envies
                </h4>
                <p className="text-sm text-blue-800 mt-2">
                  Retrouvez vos articles favoris sauvegardés.
                </p>
                <Link to="/account/wishlist" className="mt-4 inline-flex items-center text-xs font-bold text-blue-700 uppercase tracking-wider group-hover:underline">
                  Voir mes favoris <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-32 h-32 text-blue-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
