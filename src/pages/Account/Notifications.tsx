import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Info, Ticket, CheckCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { getSupabase } from '../../lib/supabase';

interface UserNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/account/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/account/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/account/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('Toutes les notifications marquées comme lues');
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500 text-sm">
            Restez informé de vos bons d'achat, commandes et avantages exclusifs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition shrink-0"
          >
            <CheckCheck size={15} className="text-[#FF6B00]" />
            <span>Tout marquer comme lu ({unreadCount})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-orange-50/60 border border-orange-100 p-8 rounded-3xl text-center">
          <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Aucune nouvelle notification</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
            Vous êtes à jour ! Vous recevrez une notification ici dès qu'un bon d'achat vous sera attribué ou lors du suivi de vos commandes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start gap-4 ${
                n.is_read
                  ? 'bg-white border-gray-100'
                  : 'bg-orange-50/70 border-orange-200 shadow-xs'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'voucher'
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {n.type === 'voucher' ? <Ticket size={20} /> : <Bell size={20} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#FF6B00] inline-block shrink-0" />
                    )}
                  </h4>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {new Date(n.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>

                {n.link && (
                  <Link
                    to={n.link}
                    onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FF6B00] hover:underline mt-2.5"
                  >
                    <span>Voir mes bons d'achat</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 pt-4">
        <h4 className="font-bold text-gray-900 flex items-center">
          <Info className="w-4 h-4 mr-2 text-gray-400" /> Préférences
        </h4>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Alertes bons d'achat & commandes</p>
              <p className="text-xs text-gray-500">Recevoir vos notifications directement dans votre espace client</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Actif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
