import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, User, Clock, Check, CheckCheck, Sparkles, Shield, AlertCircle, Phone, PhoneCall } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/AuthContext';

interface ChatMessage {
  id: number;
  sender: 'client' | 'admin' | 'system';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function getOrCreateChatSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('zorando_chat_session_id');
  if (!id) {
    id = 'cs_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('zorando_chat_session_id', id);
  }
  return id;
}

export default function LiveChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [callbackDismissed, setCallbackDismissed] = useState(false);
  const [availability, setAvailability] = useState<{ status: string; message: string }>({
    status: 'online_fast',
    message: 'Bonjour et bienvenue sur ZORANDO ! Un conseiller va vous répondre dans un instant.'
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize customer name from profile or local storage
  useEffect(() => {
    if (profile) {
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      if (name) {
        setCustomerName(name);
        localStorage.setItem('zorando_chat_customer_name', name);
      }
    } else {
      const stored = localStorage.getItem('zorando_chat_customer_name');
      if (stored) setCustomerName(stored);
    }
  }, [profile]);

  // Listen for global 'open-live-chat' event from header or anywhere
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-live-chat', handleOpenEvent);
    return () => window.removeEventListener('open-live-chat', handleOpenEvent);
  }, []);

  // Fetch chat status
  useEffect(() => {
    fetch('/api/chat/status')
      .then(res => res.json())
      .then(data => {
        if (data.status) setAvailability(data);
      })
      .catch(() => {});
  }, []);

  const prevMsgCountRef = useRef<number>(0);

  // Play subtle chime on client side when admin replies
  const playClientChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.setValueAtTime(987.77, audioCtx.currentTime + 0.1); // B5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  };

  const isFetchingRef = useRef<boolean>(false);

  // Fetch messages function with cache-busting and overlap guard
  const fetchMessages = async () => {
    if (isFetchingRef.current) return;
    const sessionId = getOrCreateChatSessionId();
    if (!sessionId) return;

    isFetchingRef.current = true;
    try {
      const res = await fetch(`/api/chat/messages?session_id=${sessionId}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages) {
        const adminMsgs = data.messages.filter((m: ChatMessage) => m.sender === 'admin');
        if (adminMsgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
          playClientChime();
        }
        prevMsgCountRef.current = adminMsgs.length;
        setMessages(data.messages);
      }
      if (data.conversation) {
        setConversation(data.conversation);
        if (!isOpen) {
          setUnreadCount(data.conversation.unread_client_count || 0);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (e) {
      // Background silent catch
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneInput.replace(/\D/g, '');
    if (!digits || digits.length < 8) {
      setPhoneError('Veuillez entrer un numéro valide (ex: 07 81 95 59 25)');
      return;
    }
    setSubmittingPhone(true);
    setPhoneError('');
    try {
      const sessionId = getOrCreateChatSessionId();
      const res = await fetch('/api/chat/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          phone: phoneInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || 'Erreur lors de l\'envoi');
        return;
      }
      toast.success('Merci ! Notre équipe ZORANDO vous contactera dès que possible.', { duration: 5000 });
      localStorage.setItem('zorando_chat_callback_sent', sessionId);
      setPhoneInput('');
      fetchMessages();
    } catch (err) {
      setPhoneError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setSubmittingPhone(false);
    }
  };

  // Visibility-aware live polling: 2.5s when open, 10s when closed, paused when tab hidden
  useEffect(() => {
    fetchMessages();

    const intervalTime = isOpen ? 2500 : 10000;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, intervalTime);

    const handleVisibility = () => {
      if (!document.hidden) fetchMessages();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || sending) return;

    setSending(true);
    const sessionId = getOrCreateChatSessionId();

    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      sender: 'client',
      sender_name: customerName || 'Vous',
      message: cleanText,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: cleanText,
          customer_name: customerName || undefined,
          customer_email: profile?.email || undefined,
          customer_phone: profile?.phone || undefined,
          user_id: user?.id || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
        }
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const hasClientMessage = messages.some(m => m.sender === 'client');
  const alreadyHasPhone = !!(
    conversation?.customer_phone || 
    conversation?.callback_requested || 
    (typeof window !== 'undefined' && localStorage.getItem('zorando_chat_callback_sent') === getOrCreateChatSessionId())
  );
  const shouldShowCallbackPrompt = hasClientMessage && !alreadyHasPhone && !callbackDismissed;

  const location = useLocation();
  const pathname = location.pathname || '';
  const isCheckoutPage = pathname.startsWith('/checkout');
  const isCartPage = pathname === '/cart';
  const isProductPage = pathname.startsWith('/product/') || pathname.startsWith('/products/') || pathname.startsWith('/produit/');
  const isCartOrCheckout = isCheckoutPage || isCartPage;

  // Determine button positioning and visibility classes
  let buttonClasses = '';
  if (isCartOrCheckout) {
    if (unreadCount > 0) {
      // If customer has an unread message while on cart/checkout,
      // show a compact floating badge on the bottom-LEFT side to avoid overlapping
      // "Passer la commande" or "Confirmer ma commande" located on the right/center
      buttonClasses = 'fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-3.5 z-40 sm:left-auto sm:right-6 sm:bottom-6 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-3.5';
    } else {
      // On mobile cart/checkout: hide the floating bubble to completely prevent
      // obstructing "Commander" / "Passer la commande", keyboard inputs, and validation buttons.
      // Customer can always access chat from the header "Besoin d'aide ?" or in-page assistance buttons.
      buttonClasses = 'hidden sm:flex sm:fixed sm:bottom-6 sm:right-6 sm:w-auto sm:h-auto sm:px-4 sm:py-3.5';
    }
  } else if (isProductPage) {
    // On product page: Mobile sticky bar (Phone + Add to Cart + "J'achète") occupies bottom 0-78px.
    // Elevate the chat bubble strictly ABOVE the bar (86px + safe-area) and keep it compact (44x44px).
    buttonClasses = 'fixed bottom-[calc(86px+env(safe-area-inset-bottom,0px))] right-3.5 z-40 sm:bottom-6 sm:right-6 sm:w-auto sm:h-auto sm:px-4 sm:py-3.5 w-11 h-11';
  } else {
    // General mobile pages (Home, Category, Brands, Account, Blog...):
    // Discreet compact bubble at bottom right with safe area padding.
    buttonClasses = 'fixed bottom-[calc(18px+env(safe-area-inset-bottom,0px))] right-3.5 z-40 sm:bottom-6 sm:right-6 sm:w-auto sm:h-auto sm:px-4 sm:py-3.5 w-11 h-11';
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`${buttonClasses} flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group border-2 border-white/20`}
          aria-label="Ouvrir le chat en direct"
        >
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="font-bold text-sm tracking-wide hidden sm:inline">Besoin d'aide ?</span>
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[70] w-full sm:w-[400px] h-[100dvh] sm:h-[580px] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-black text-white p-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white shadow-md">
                  Z
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                  availability.status === 'offline' ? 'bg-gray-400' : 'bg-emerald-500'
                }`} />
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Support Client ZORANDO
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-300">
                  {availability.status === 'online_fast' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      En ligne • Réponse &lt; 5 min
                    </span>
                  ) : availability.status === 'online' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      En ligne
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Indisponible • Laissez un message
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
              aria-label="Fermer le chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Name prompt for guest if not configured */}
          {!profile && !customerName && (
            <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
              <input
                type="text"
                placeholder="Votre prénom (facultatif)"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  localStorage.setItem('zorando_chat_customer_name', e.target.value);
                }}
                className="bg-transparent text-gray-800 text-xs placeholder:text-gray-400 focus:outline-none flex-1 font-medium"
              />
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/60 text-sm">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Une question sur un produit ou une livraison ?</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                    Écrivez-nous directement ici, notre équipe vous répond en direct !
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isClient = msg.sender === 'client';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-center shadow-2xs max-w-[90%]">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClient ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        isClient
                          ? 'bg-orange-600 text-white rounded-br-xs'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                      }`}
                    >
                      {!isClient && (
                        <div className="font-extrabold text-[10px] text-orange-600 uppercase tracking-wider mb-1">
                          {msg.sender_name || 'Conseiller ZORANDO'}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 px-1">
                      <span>{formatMessageTime(msg.created_at)}</span>
                      {isClient && (
                        msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-orange-600" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Rapid Callback Request Card */}
            {shouldShowCallbackPrompt && (
              <div className="mx-1 my-2.5 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white border border-orange-200/90 rounded-2xl p-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-extrabold text-xs text-gray-900 leading-tight">
                      Vous souhaitez une réponse rapide ?
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCallbackDismissed(true)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-black/5 transition"
                    aria-label="Ignorer"
                    title="Continuer par écrit"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-600 mb-2.5 leading-snug">
                  Laissez votre numéro de téléphone et notre équipe ZORANDO vous rappellera rapidement pour répondre à vos questions.
                </p>

                <form onSubmit={handleRequestCallback} className="space-y-2">
                  <div className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-orange-500 shadow-2xs">
                    <span className="text-xs font-bold text-gray-700 font-mono select-none flex items-center gap-1">
                      🇩🇿 +213
                    </span>
                    <div className="w-px h-4 bg-gray-200" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ex : 07 81 95 59 25"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value);
                        setPhoneError('');
                      }}
                      className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      disabled={submittingPhone}
                    />
                  </div>

                  {phoneError && (
                    <p className="text-[10px] text-red-600 font-semibold px-1">{phoneError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingPhone || !phoneInput.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submittingPhone ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PhoneCall className="w-3.5 h-3.5" />
                    )}
                    <span>Être rappelé</span>
                  </button>

                  <p className="text-[9.5px] text-gray-400 text-center leading-tight">
                    Votre numéro sera utilisé pour vous contacter au sujet de votre demande.
                  </p>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Écrivez votre message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              disabled={sending}
              maxLength={1500}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition flex-shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
