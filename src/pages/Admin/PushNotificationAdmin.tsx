import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import toast from 'react-hot-toast';
import {
  Bell,
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  ExternalLink,
  Sparkles,
  Flame,
  Truck,
  Tag,
  Zap,
  Gift,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface Campaign {
  id: number;
  title: string;
  body: string;
  image?: string;
  url: string;
  target_audience: string;
  recipients_count: number;
  success_count: number;
  failure_count: number;
  status: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  endpoint: string;
  user_agent: string;
  created_at: string;
}

const TEMPLATES = [
  {
    name: 'Vente Flash 24H',
    icon: Flame,
    color: 'from-amber-500 to-red-600',
    title: '🔥 Vente Flash : Jusqu\'à -50% aujourd\'hui !',
    body: 'Profitez de remises exceptionnelles sur une sélection exclusive Zorando. Quantités très limitées !',
    url: '/category/promos',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Livraison Gratuite',
    icon: Truck,
    color: 'from-blue-500 to-indigo-600',
    title: '🚚 Livraison OFFERTE sur toutes vos commandes !',
    body: 'Ce week-end seulement, recevez vos articles préf��rés chez vous sans aucun frais de livraison.',
    url: '/',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Nouveaux Arrivages',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
    title: '✨ Nouvelle Collection disponible sur Zorando',
    body: 'Découvrez les dernières tendances mode et maison fraîchement arrivées. Soyez le premier à commander !',
    url: '/',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Déstockage Massif',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    title: '⚡ Déstockage : Prix coûtant sur le stock !',
    body: 'Dernière chance pour shopper vos marques favorites à prix cassés avant rupture définitive.',
    url: '/category/promos',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cadeau & Promo VIP',
    icon: Gift,
    color: 'from-rose-500 to-orange-500',
    title: '🎁 Un cadeau exclusif vous attend !',
    body: 'Accédez à votre offre spéciale de fidélité pour toute commande validée aujourd\'hui sur Zorando.',
    url: '/',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80'
  }
];

export default function PushNotificationAdmin() {
  const token = localStorage.getItem('adminToken');

  const swrFetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  };

  const { data, error, isLoading, isValidating } = useSWR('/api/admin/push/dashboard', swrFetcher, {
    refreshInterval: 10000 // Poll every 10s
  });

  const [title, setTitle] = useState('🔥 Vente Flash : Jusqu\'à -50% aujourd\'hui !');
  const [body, setBody] = useState('Profitez de remises exceptionnelles sur une sélection exclusive Zorando. Quantités limitées !');
  const [url, setUrl] = useState('/');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80');
  const [target, setTarget] = useState<'all' | 'latest_test'>('all');
  const [isSending, setIsSending] = useState(false);

  const totalSubscribers: number = data?.totalSubscribers || 0;
  const recentCampaigns: Campaign[] = data?.recentCampaigns || [];
  const recentSubscribers: Subscriber[] = data?.recentSubscribers || [];
  const vapidPublicKey: string = data?.vapidPublicKey || '';

  const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setUrl(tmpl.url);
    setImage(tmpl.image);
    toast.success(`Modèle "${tmpl.name}" appliqué !`);
  };

  const addEmoji = (emoji: string) => {
    setTitle((prev) => prev + ' ' + emoji);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier !`);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Veuillez renseigner un titre et un message');
      return;
    }

    if (totalSubscribers === 0 && target === 'all') {
      toast.error("Aucun abonné enregistré. Activez d'abord les notifications sur un appareil !");
      return;
    }

    const confirmMsg = target === 'latest_test'
      ? 'Envoyer un test sur le dernier appareil abonné ?'
      : `Envoyer cette notification push à TOUS les ${totalSubscribers} abonnés ?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          body,
          url,
          image: image.trim() || null,
          target
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Échec de l'envoi");

      if (result.sent > 0) {
        toast.success(`✅ Notification envoyée avec succès à ${result.sent} appareil(s) ! (${result.failed} échec(s))`, {
          duration: 5000
        });
      } else {
        toast.error(`Aucun envoi réussi. Détails : ${result.message || 'Erreur technique'}`);
      }

      mutate('/api/admin/push/dashboard');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de la notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!window.confirm('Supprimer cette campagne de l\'historique ?')) return;
    try {
      const res = await fetch(`/api/admin/push/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Campagne supprimée');
        mutate('/api/admin/push/dashboard');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleClearSubscriptions = async () => {
    if (!window.confirm('⚠️ ATTENTION : Cela va vider tous les abonnés de la table. Les utilisateurs devront réautoriser les notifications. Continuer ?')) return;
    try {
      const res = await fetch('/api/admin/push/clear-subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Abonnés purgés');
        mutate('/api/admin/push/dashboard');
      }
    } catch {
      toast.error('Erreur lors de la purge');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-white border border-gray-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <Bell className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Centre de Notifications Push</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                VAPID P-256 Actif
              </span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl">
              Diffusez des alertes instantanées sur les téléphones et ordinateurs de vos clients (Ventes Flash, Promotions, Nouveautés).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => mutate('/api/admin/push/dashboard')}
              disabled={isValidating}
              className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center gap-2 transition"
              title="Rafraîchir les statistiques"
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin text-orange-400' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Audience Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/60">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Audience Active</span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : totalSubscribers}
              <span className="text-xs font-normal text-gray-400 ml-2">appareil(s) abonnés</span>
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/60">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Campagnes Envoyées</span>
              <History className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : recentCampaigns.length}
              <span className="text-xs font-normal text-gray-400 ml-2">diffusions</span>
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-4 border border-gray-700/60">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Clé Publique VAPID</span>
              <button
                onClick={() => copyToClipboard(vapidPublicKey, 'Clé Publique')}
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copier
              </button>
            </div>
            <div className="text-xs font-mono text-gray-300 truncate" title={vapidPublicKey}>
              {vapidPublicKey ? `${vapidPublicKey.slice(0, 24)}...${vapidPublicKey.slice(-10)}` : 'Non configurée'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Campaign Creation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Quick Conversion Templates */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Modèles Haute Conversion (1 Clic)
              </h2>
              <span className="text-xs text-gray-400">Inspiré des leaders e-commerce</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TEMPLATES.map((tmpl) => {
                const IconComponent = tmpl.icon;
                return (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="p-3 text-left rounded-xl border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group flex flex-col justify-between bg-gray-50/50 hover:bg-orange-50/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tmpl.color} text-white shadow-xs`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-gray-800 group-hover:text-orange-600 transition">
                        {tmpl.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 line-clamp-1">
                      {tmpl.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Campaign Form */}
          <form onSubmit={handleSendCampaign} className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-500" />
                Détails du message Push
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Rédigez un message court, clair et incitatif pour maximiser le taux de clics.
              </p>
            </div>

            {/* Title with Emoji Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Titre de la notification *</label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-400 mr-1.5">{title.length}/60 car.</span>
                  {['🔥', '🎉', '⚡', '🚚', '🎁', '⏳'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => addEmoji(em)}
                      className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-orange-100 rounded transition"
                      title={`Ajouter ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 🔥 Vente Flash : Jusqu'à -50% aujourd'hui !"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                required
                maxLength={80}
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Message / Corps du texte *</label>
                <span className="text-[11px] text-gray-400">{body.length}/120 car.</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Profitez de remises exclusives sur une sélection de nos meilleurs produits..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                required
                maxLength={160}
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Lien de redirection (au clic du client)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Ex: / ou /category/promos ou https://zorando.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-gray-400 py-0.5">Raccourcis :</span>
                {[
                  { label: 'Accueil', val: '/' },
                  { label: 'Ventes Flash', val: '/category/promos' },
                  { label: 'Homme', val: '/category/homme' },
                  { label: 'Femme', val: '/category/femme' },
                  { label: 'Beauté', val: '/category/beaute' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setUrl(item.val)}
                    className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Promo Image */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5 flex items-center justify-between">
                <span>Grande Image promotionnelle (Bannière)</span>
                <span className="text-[11px] text-gray-400">Optionnel mais recommandé (+35% clics)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... (URL de l'image)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-mono text-xs"
                />
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-gray-200"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Audience Targeting */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                Cible d'envoi
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    target === 'all'
                      ? 'bg-orange-50/80 border-orange-500 text-orange-900 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={target === 'all'}
                    onChange={() => setTarget('all')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Tous les abonnés ({totalSubscribers})
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Diffusion massive sur l'ensemble de votre base client.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    target === 'latest_test'
                      ? 'bg-orange-50/80 border-orange-500 text-orange-900 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value="latest_test"
                    checked={target === 'latest_test'}
                    onChange={() => setTarget('latest_test')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-500" />
                      Test sur mon appareil
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Envoie uniquement au dernier appareil abonné (pour tester).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending || (target === 'all' && totalSubscribers === 0)}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] transition shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Envoi en cours via les serveurs Google FCM...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {target === 'latest_test'
                      ? 'Envoyer le test sur mon appareil'
                      : `Diffuser la notification (${totalSubscribers} abonnés)`}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Realistic Live Smartphone Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-500" />
                Aperçu Smartphone en Direct
              </h2>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Temps réel
              </span>
            </div>

            {/* Mock Smartphone Frame */}
            <div className="w-full max-w-[340px] mx-auto bg-gray-950 rounded-[40px] p-3.5 shadow-2xl border-4 border-gray-800 relative">
              {/* Speaker / Dynamic Island notch */}
              <div className="w-24 h-4 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-800" />
              </div>

              {/* Screen Content */}
              <div className="bg-gradient-to-b from-slate-900 via-gray-900 to-slate-950 rounded-[30px] p-3.5 text-white min-h-[460px] flex flex-col justify-between relative overflow-hidden">
                {/* Clock on lockscreen */}
                <div className="text-center pt-3 pb-4">
                  <div className="text-3xl font-light tracking-tight text-white/90">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[11px] text-gray-400 capitalize">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* The Push Notification Card */}
                <div className="bg-white/95 backdrop-blur-md text-gray-900 rounded-2xl p-3.5 shadow-xl border border-white/20 transition-all transform hover:scale-[1.01] my-auto">
                  {/* Notification Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                        Z
                      </div>
                      <span className="font-bold text-xs tracking-tight text-gray-900">ZORANDO</span>
                      <span className="text-[10px] text-gray-400">• maintenant</span>
                    </div>
                    <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded">
                      Promo
                    </span>
                  </div>

                  {/* Notification Title */}
                  <div className="font-bold text-xs leading-snug text-gray-950 mb-1">
                    {title || 'Titre de la notification'}
                  </div>

                  {/* Notification Body */}
                  <p className="text-[11px] leading-relaxed text-gray-600 line-clamp-3 mb-2">
                    {body || 'Votre message promotionnel apparaîtra ici en temps réel pour le client...'}
                  </p>

                  {/* Notification Big Image if provided */}
                  {image && (
                    <div className="rounded-xl overflow-hidden mb-2 bg-gray-100 max-h-36 border border-gray-200/50">
                      <img
                        src={image}
                        alt="Promo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Notification Actions */}
                  <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-[11px] font-semibold text-orange-600">
                    <span className="hover:underline flex items-center gap-1 cursor-pointer">
                      Ouvrir Zorando
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <span className="text-gray-400 font-normal text-[10px]">Fermer</span>
                  </div>
                </div>

                {/* Bottom Home indicator */}
                <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-4 mb-1" />
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-3">
              Rendu fidèle sur Android Chrome, Windows, macOS et navigateurs compatibles.
            </p>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Bonnes pratiques E-commerce
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-amber-800/90 leading-relaxed">
              <li><strong>Heures de pointe :</strong> Envoyez vos alertes entre 12h-14h ou 19h-21h pour un maximum de conversion.</li>
              <li><strong>Urgence :</strong> Les mentions "24H seulement", "Stock limité" génèrent +40% de commandes.</li>
              <li><strong>Grande image :</strong> Une photo de produit nette attire immédiatement le regard du client.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Sent Campaigns History & Subscribers Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Campaigns (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-orange-500" />
                Historique des Campagnes Diffusées
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Suivi des envois, succès de distribution et performances.
              </p>
            </div>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">Aucune campagne diffusée pour le moment.</p>
              <p className="text-xs mt-1">Créez votre première alerte ci-dessus !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Notification</th>
                    <th className="py-3 px-3">Cible</th>
                    <th className="py-3 px-3 text-center">Succès / Échecs</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentCampaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(camp.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="font-bold text-gray-900 truncate" title={camp.title}>
                          {camp.title}
                        </div>
                        <div className="text-gray-500 truncate text-[11px]" title={camp.body}>
                          {camp.body}
                        </div>
                        {camp.url && (
                          <div className="text-[10px] text-orange-600 truncate mt-0.5 font-mono">
                            {camp.url}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {camp.target_audience === 'latest_test' ? 'Test (1 appareil)' : 'Tous'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                            {camp.success_count} réussis
                          </span>
                          {camp.failure_count > 0 && (
                            <span className="px-2 py-0.5 rounded-md font-semibold text-red-700 bg-red-50 border border-red-200">
                              {camp.failure_count} échec(s)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setTitle(camp.title);
                              setBody(camp.body);
                              setUrl(camp.url || '/');
                              if (camp.image) setImage(camp.image);
                              toast.success('Campagne copiée dans le formulaire !');
                            }}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Réutiliser ce modèle"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscribers & Maintenance (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Derniers Appareils Inscrits
            </h2>
            <span className="text-xs text-gray-500 font-bold">{totalSubscribers} total</span>
          </div>

          {recentSubscribers.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Aucun abonné enregistré.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {recentSubscribers.map((sub) => {
                const isMobile = /Android|iPhone|iPad/i.test(sub.user_agent || '');
                return (
                  <div
                    key={sub.id}
                    className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 shrink-0">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 text-[11px] truncate">
                          {isMobile ? 'Mobile' : 'Ordinateur'} • {sub.user_agent?.split(' ')[0] || 'Browser'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">
                          {sub.endpoint.slice(0, 30)}...
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(sub.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Maintenance Tools */}
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleClearSubscriptions}
              className="w-full py-2 px-3 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-xl font-medium transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purger tous les abonnés (Reset)
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              À utiliser uniquement en cas de réinitialisation complète des clés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
