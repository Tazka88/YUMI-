import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  MessageCircle, Search, RefreshCw, Send, CheckCheck, 
  CheckCircle2, Clock, AlertTriangle, AlertCircle, Phone, 
  Mail, User, Volume2, VolumeX, Sparkles, Filter, 
  ChevronRight, ArrowLeft, ShieldCheck, Flame, X, Trash2
} from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'client' | 'admin' | 'system';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  session_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  callback_requested?: boolean;
  callback_requested_at?: string | null;
  callback_status?: 'pending' | 'completed' | null;
  status: 'open' | 'waiting_admin' | 'waiting_client' | 'resolved';
  unread_admin_count: number;
  first_client_message_at: string | null;
  waiting_since: string | null;
  first_admin_reply_at: string | null;
  first_response_time_seconds: number | null;
  last_message_text: string | null;
  last_message_at: string;
  created_at: string;
  wait_seconds_raw?: number;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_phone?: string;
  profile_email?: string;
}

interface ChatStats {
  totalCount: number;
  unansweredCount: number;
  warning3minCount: number;
  alert5minCount: number;
  resolvedTodayCount: number;
  callbackPendingCount?: number;
  avgResponseSeconds: number | null;
  availabilityStatus: string;
}

const QUICK_REPLIES = [
  "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
  "Oui, ce produit est 100% disponible en stock avec livraison rapide 58 wilayas !",
  "Le paiement se fait à la livraison directement lors de la réception de votre colis.",
  "Pourriez-vous me préciser votre wilaya et numéro de téléphone pour valider votre commande ?",
  "Je vérifie immédiatement cela pour vous, un instant s'il vous plaît."
];

export default function LiveChatAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats>({
    totalCount: 0,
    unansweredCount: 0,
    warning3minCount: 0,
    alert5minCount: 0,
    resolvedTodayCount: 0,
    callbackPendingCount: 0,
    avgResponseSeconds: null,
    availabilityStatus: 'online_fast'
  });
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState<'all' | 'callback_pending' | 'unanswered' | 'waiting_over_3min' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    convId: string;
    customerName: string;
    isPurge?: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);

  // Debounce search term to prevent UI lag and unnecessary requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Live timer tick every 5 seconds to update waiting elapsed time in real time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Play chime sound on new message
  const playSoundAlert = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  };

  const isFetchingConvsRef = useRef<boolean>(false);
  const isFetchingMsgsRef = useRef<boolean>(false);

  const fetchConversations = async (silent = false) => {
    if (isFetchingConvsRef.current) return;
    isFetchingConvsRef.current = true;
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      params.set('_t', String(Date.now()));

      const res = await fetch(`/api/admin/chat/conversations?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Erreur de chargement');

      const data = await res.json();
      const newConvs: Conversation[] = data.conversations || [];
      setConversations(newConvs);
      if (data.stats) setStats(data.stats);

      // Check if new unread arrived
      const totalUnread = newConvs.reduce((acc, c) => acc + (c.unread_admin_count || 0), 0);
      if (totalUnread > prevUnreadRef.current) {
        playSoundAlert();
        toast('Nouveau message client reçu !', { icon: '💬' });
      }
      prevUnreadRef.current = totalUnread;

      // Update selected conversation in place if still selected
      if (selectedConv) {
        const updated = newConvs.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      isFetchingConvsRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    if (isFetchingMsgsRef.current) return;
    isFetchingMsgsRef.current = true;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/conversations/${convId}/messages?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      // Reset unread count locally
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_admin_count: 0 } : c));
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingMsgsRef.current = false;
    }
  };

  // Initial and search/filter fetch
  useEffect(() => {
    fetchConversations();
  }, [filter, debouncedSearch]);

  // Robust visibility-aware polling: active messages every 2.5s, list every 4s
  useEffect(() => {
    const convTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchConversations(true);
    }, 4000);

    let msgTimer: NodeJS.Timeout | null = null;
    if (selectedConv?.id) {
      msgTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        fetchMessages(selectedConv.id);
      }, 2500);
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchConversations(true);
        if (selectedConv?.id) fetchMessages(selectedConv.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(convTimer);
      if (msgTimer) clearInterval(msgTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [filter, debouncedSearch, selectedConv?.id]);

  // When conversation selection changes, fetch its messages
  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = replyText.trim();
    if (!clean || !selectedConv || sendingReply) return;

    setSendingReply(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/conversations/${selectedConv.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: clean })
      });

      if (!res.ok) throw new Error('Échec d\'envoi de la réponse');

      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      setReplyText('');
      toast.success('Réponse envoyée');
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: 'resolved' | 'waiting_admin') => {
    if (!selectedConv) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/conversations/${selectedConv.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Erreur de mise à jour');
      toast.success(newStatus === 'resolved' ? 'Conversation marquée comme résolue' : 'Conversation réouverte');
      setSelectedConv(prev => prev ? { ...prev, status: newStatus } : null);
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');

      // Optimistic state update
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
      setDeleteConfirm(null);
      toast.success('Conversation supprimée avec succès');
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de supprimer la conversation');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateCallbackStatus = async (convId: string, newStatus: 'pending' | 'completed') => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/conversations/${convId}/callback-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Erreur de mise à jour');
      toast.success(newStatus === 'completed' ? 'Rappel marqué comme traité ✅' : 'Rappel remis en attente');
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, callback_status: newStatus } : c));
      if (selectedConv?.id === convId) {
        setSelectedConv(prev => prev ? { ...prev, callback_status: newStatus } : null);
      }
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de modifier le statut');
    }
  };

  const handlePurgeResolved = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/chat/conversations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ purgeResolved: true })
      });
      if (!res.ok) throw new Error('Erreur lors de la purge');
      const data = await res.json();
      setConversations(prev => prev.filter(c => c.status !== 'resolved'));
      if (selectedConv?.status === 'resolved') {
        setSelectedConv(null);
        setMessages([]);
      }
      setDeleteConfirm(null);
      toast.success(`${data.deletedCount || 0} conversation(s) résolue(s) purgée(s)`);
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de purger les conversations');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateAvailability = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/chat/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability_status: newStatus })
      });
      if (!res.ok) throw new Error('Erreur de mise à jour');
      setStats(prev => ({ ...prev, availabilityStatus: newStatus }));
      toast.success(`Statut mis à jour : ${
        newStatus === 'online_fast' ? 'En ligne (< 5 min)' : newStatus === 'online' ? 'En ligne' : 'Indisponible'
      }`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Calculate wait time in minutes from waiting_since or fallback to last_message_at
  const getWaitMinutes = (conv: Conversation) => {
    const refTime = conv.waiting_since || conv.last_message_at || conv.created_at;
    if (!refTime) return 0;
    const waitMs = now - new Date(refTime).getTime();
    return Math.max(0, Math.floor(waitMs / 60000));
  };

  const formatWaitBadge = (conv: Conversation) => {
    if (conv.status !== 'waiting_admin') return null;
    const mins = getWaitMinutes(conv);

    if (mins >= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-600 text-white shadow-xs animate-pulse">
          <Flame className="w-3 h-3" />
          Dépassé : {mins} min
        </span>
      );
    }
    if (mins >= 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-xs animate-pulse">
          <AlertCircle className="w-3 h-3" />
          Alerte : {mins} min
        </span>
      );
    }
    if (mins >= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
          <AlertTriangle className="w-3 h-3" />
          Attention : {mins} min
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3" />
        Attente : {mins < 1 ? '< 1 min' : `${mins} min`}
      </span>
    );
  };

  const formatAvgTime = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Chat en Direct</h1>
            <p className="text-sm text-gray-500">
              Répondez à vos clients en temps réel. Objectif d'excellence : <strong className="text-orange-600 font-bold">&le; 5 minutes</strong>.
            </p>
          </div>
        </div>

        {/* Availability Controls, Purge & Sound Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition shadow-xs ${
              soundEnabled ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
            title={soundEnabled ? 'Alerte sonore activée' : 'Alerte sonore coupée'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Availability Pills */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => handleUpdateAvailability('online_fast')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                stats.availabilityStatus === 'online_fast'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              &lt; 5 min
            </button>
            <button
              onClick={() => handleUpdateAvailability('online')}
              className={`px-3 py-1.5 rounded-lg transition ${
                stats.availabilityStatus === 'online'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              En ligne
            </button>
            <button
              onClick={() => handleUpdateAvailability('offline')}
              className={`px-3 py-1.5 rounded-lg transition ${
                stats.availabilityStatus === 'offline'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Indisponible
            </button>
          </div>

          <button
            onClick={() => fetchConversations()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition shadow-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Rappel Client */}
        <div 
          onClick={() => setFilter(filter === 'callback_pending' ? 'all' : 'callback_pending')}
          className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden cursor-pointer transition ${
            filter === 'callback_pending' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500' : 'bg-white border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">À rappeler</p>
              <h3 className="text-3xl font-black text-purple-700 mt-1">{stats.callbackPendingCount || 0}</h3>
              <p className="text-xs text-purple-500 mt-1">Demandes de rappel client</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-xs">
              <Phone className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
        </div>

        {/* Unanswered */}
        <div 
          onClick={() => setFilter(filter === 'unanswered' ? 'all' : 'unanswered')}
          className={`bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden cursor-pointer transition ${
            filter === 'unanswered' ? 'border-orange-400 ring-2 ring-orange-500' : 'border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">En attente de réponse</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.unansweredCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Clients qui attendent</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
        </div>

        {/* 5 min alert */}
        <div 
          onClick={() => setFilter(filter === 'waiting_over_3min' ? 'all' : 'waiting_over_3min')}
          className={`bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden cursor-pointer transition ${
            filter === 'waiting_over_3min' ? 'border-red-400 ring-2 ring-red-500' : 'border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">Dépassé &gt; 5 minutes</p>
              <h3 className="text-3xl font-black text-red-600 mt-1">{stats.alert5minCount}</h3>
              <p className="text-xs text-red-400 mt-1">À traiter en priorité urgente !</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
              <Flame className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>

        {/* Average response time */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Délai moyen de 1ère réponse</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{formatAvgTime(stats.avgResponseSeconds)}</h3>
              <p className="text-xs text-gray-400 mt-1">Temps réel réponse humaine</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Resolved Today */}
        <div 
          onClick={() => setFilter(filter === 'resolved' ? 'all' : 'resolved')}
          className={`bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden cursor-pointer transition ${
            filter === 'resolved' ? 'border-emerald-400 ring-2 ring-emerald-500' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Résolues aujourd'hui</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.resolvedTodayCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Sur {stats.totalCount} conversations</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Main Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[640px]">
        {/* Left Column: Conversations List (5 Cols) */}
        <div className={`lg:col-span-5 border-r border-gray-100 flex flex-col ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          {/* Filters & Search */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher nom, téléphone, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Tabs & Purge Resolved Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold overflow-x-auto flex-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    filter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Toutes ({stats.totalCount})
                </button>
                <button
                  onClick={() => setFilter('callback_pending')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition flex items-center gap-1 ${
                    filter === 'callback_pending' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>À rappeler ({stats.callbackPendingCount || 0})</span>
                </button>
                <button
                  onClick={() => setFilter('unanswered')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    filter === 'unanswered' ? 'bg-orange-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  À répondre ({stats.unansweredCount})
                </button>
                <button
                  onClick={() => setFilter('waiting_over_3min')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    filter === 'waiting_over_3min' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Urgents ({stats.warning3minCount + stats.alert5minCount})
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition ${
                    filter === 'resolved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Résolus
                </button>
              </div>

              {/* Purge resolved button */}
              {conversations.some(c => c.status === 'resolved') && (
                <button
                  onClick={() => setDeleteConfirm({
                    isOpen: true,
                    convId: '',
                    customerName: '',
                    isPurge: true
                  })}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 border border-red-200 shrink-0"
                  title="Supprimer toutes les conversations résolues"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Purger</span>
                </button>
              )}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Aucune conversation trouvée</p>
                <p className="text-[11px] text-gray-400 mt-1">Les messages des clients apparaîtront ici.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const isUnanswered = conv.status === 'waiting_admin';

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-4 cursor-pointer transition flex items-start gap-3 relative group ${
                      isSelected ? 'bg-orange-50/60 border-l-4 border-orange-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center font-black text-gray-700 text-xs shadow-2xs">
                        {conv.customer_name ? conv.customer_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      {isUnanswered && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {conv.customer_name || 'Client ZORANDO'}
                          </h4>
                          {conv.callback_requested && (
                            conv.callback_status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-purple-600 text-white shrink-0 animate-pulse">
                                <Phone className="w-2.5 h-2.5" /> À rappeler
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Traité
                              </span>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(conv.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                isOpen: true,
                                convId: conv.id,
                                customerName: conv.customer_name || 'ce client'
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Supprimer la conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {conv.customer_phone && (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-purple-700 mb-0.5">
                          <Phone className="w-2.5 h-2.5 text-purple-600" />
                          <span>{conv.customer_phone}</span>
                        </div>
                      )}

                      <p className="text-xs text-gray-600 truncate mb-1.5 font-medium">
                        {conv.last_message_text || 'Nouvelle conversation'}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div>
                          {formatWaitBadge(conv) || (
                            <span className="text-[11px] font-semibold text-gray-400">
                              {conv.status === 'resolved' ? 'Résolu' : 'En attente du client'}
                            </span>
                          )}
                        </div>

                        {conv.unread_admin_count > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                            {conv.unread_admin_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (7 Cols) */}
        <div className={`lg:col-span-7 flex flex-col ${!selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-gray-900">
                        {selectedConv.customer_name || 'Client'}
                      </h3>
                      {selectedConv.status === 'resolved' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          Résolu
                        </span>
                      ) : (
                        formatWaitBadge(selectedConv)
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {(selectedConv.customer_phone || selectedConv.profile_phone) && (
                        <a
                          href={`tel:${(selectedConv.customer_phone || selectedConv.profile_phone || '').replace(/\s+/g, '')}`}
                          className="font-mono text-purple-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-purple-600" />
                          {selectedConv.customer_phone || selectedConv.profile_phone}
                        </a>
                      )}
                      {(selectedConv.customer_email || selectedConv.profile_email) && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {selectedConv.customer_email || selectedConv.profile_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConv.status === 'resolved' ? (
                    <button
                      onClick={() => handleStatusChange('waiting_admin')}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Réouvrir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Marquer résolu
                    </button>
                  )}

                  {/* Delete Conversation Button */}
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      convId: selectedConv.id,
                      customerName: selectedConv.customer_name || 'ce client'
                    })}
                    className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                    title="Supprimer définitivement cette conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prominent Callback Notification & Action Bar */}
              {(selectedConv.callback_requested || selectedConv.customer_phone) && (
                <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                  selectedConv.callback_requested && selectedConv.callback_status === 'pending'
                    ? 'bg-gradient-to-r from-purple-50 via-amber-50/70 to-orange-50 border-purple-200'
                    : selectedConv.callback_status === 'completed'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                      selectedConv.callback_status === 'pending' ? 'bg-purple-600' : 'bg-emerald-600'
                    }`}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">
                          {selectedConv.callback_requested
                            ? (selectedConv.callback_status === 'pending' ? 'Demande de rappel à effectuer' : 'Rappel téléphonique traité')
                            : 'Numéro de contact client'}
                        </span>
                        {selectedConv.callback_requested && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            selectedConv.callback_status === 'pending'
                              ? 'bg-purple-600 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {selectedConv.callback_status === 'pending' ? 'À rappeler' : 'Traité'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                        <span className="font-mono font-bold text-gray-900">
                          {selectedConv.customer_phone || selectedConv.profile_phone}
                        </span>
                        {selectedConv.callback_requested_at && (
                          <span className="text-gray-400 text-[11px]">
                            • Demandé le {new Date(selectedConv.callback_requested_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(selectedConv.callback_requested_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct Call Button (opens phone app without dialing automatically) */}
                    {(selectedConv.customer_phone || selectedConv.profile_phone) && (
                      <a
                        href={`tel:${(selectedConv.customer_phone || selectedConv.profile_phone || '').replace(/\s+/g, '')}`}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Ouvrir l'application téléphone"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Appeler</span>
                      </a>
                    )}

                    {/* Status Toggle Button */}
                    {selectedConv.callback_requested && (
                      selectedConv.callback_status === 'completed' ? (
                        <button
                          onClick={() => handleUpdateCallbackStatus(selectedConv.id, 'pending')}
                          className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                          title="Remettre en attente d'appel"
                        >
                          Remettre à rappeler
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateCallbackStatus(selectedConv.id, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="Marquer comme traité après avoir rappelé"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Marquer comme Traité</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-gray-50/50">
                {messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-orange-50 border border-orange-200 text-orange-900 text-[11px] px-3.5 py-1.5 rounded-full font-medium shadow-2xs">
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                          isAdmin
                            ? 'bg-gray-900 text-white rounded-br-xs'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                        }`}
                      >
                        <div className={`font-bold text-[10px] mb-1 ${isAdmin ? 'text-orange-400' : 'text-gray-500'}`}>
                          {msg.sender_name || (isAdmin ? 'Vous' : 'Client')}
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>

                      <span className="text-[10px] text-gray-400 px-1">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Bar */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400 whitespace-nowrap mr-1">Réponses rapides :</span>
                {QUICK_REPLIES.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(qr)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600 transition whitespace-nowrap text-[11px] shadow-2xs"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tapez votre réponse au client..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={sendingReply}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40 transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Répondre</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-800">Sélectionnez une conversation</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[280px]">
                  Cliquez sur un message à gauche pour lire l'historique, répondre directement au client ou supprimer la discussion.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Deletion / Purge */}
      {deleteConfirm?.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 text-center mb-1">
              {deleteConfirm.isPurge ? 'Purger les conversations résolues ?' : 'Supprimer la conversation ?'}
            </h3>
            <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
              {deleteConfirm.isPurge
                ? 'Toutes les conversations marquées comme résolues ainsi que leurs messages seront définitivement supprimés.'
                : `Êtes-vous sûr de vouloir supprimer la conversation avec ${deleteConfirm.customerName} ? Tous les messages seront définitivement effacés.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirm.isPurge) {
                    await handlePurgeResolved();
                  } else if (deleteConfirm.convId) {
                    await handleDeleteConversation(deleteConfirm.convId);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
