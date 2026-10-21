import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Sparkles, Heart, Truck } from 'lucide-react';
import { isZorandoAppInstalled } from '../utils/appDetection';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.zorando.app';
const SESSION_STORAGE_KEY = 'zorando_app_popup_dismissed_session';

export default function AppDownloadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Ne pas gêner le panier, la commande, la connexion ou l'administration
  const isRestrictedRoute = 
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/commande') ||
    location.pathname.startsWith('/panier') ||
    location.pathname.startsWith('/account/login') ||
    location.pathname.startsWith('/account/register') ||
    location.pathname.startsWith('/account/forgot-password') ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/admin');

  useEffect(() => {
    // 1. Supprimer toute ancienne clé persistante (aucun délai de 7 ou 10 jours en localStorage)
    try {
      localStorage.removeItem('zorando_app_modal_dismissed');
      localStorage.removeItem('zorando_app_popup_dismissed');
      localStorage.removeItem('zorando_app_popup_dismissed_until');
      localStorage.removeItem('zorando_app_closed_until');
    } catch {
      // Ignorer les erreurs d'accès au stockage
    }

    // Si on est sur une route réservée (panier, validation de commande, login), fermer immédiatement
    if (isRestrictedRoute) {
      setIsOpen(false);
      return;
    }

    // 2. Vérifier si le pop-up a déjà été fermé lors de cette session de navigation
    try {
      if (sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
        return;
      }
    } catch {
      // Continuer en cas de restriction sur sessionStorage
    }

    // 3. Détecter si l'appareil est sous Android (ou paramètre de test ?test_app_popup=1 pour le débogage)
    const isAndroid = 
      (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '')) ||
      (typeof window !== 'undefined' && window.location.search.includes('test_app_popup=1'));

    if (!isAndroid) {
      return;
    }

    // 4. Attendre 10 secondes après l'arrivée avant d'évaluer et d'afficher le pop-up
    const timer = setTimeout(async () => {
      // Vérifier à nouveau la session et la route au moment du déclenchement
      try {
        if (sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
          return;
        }
      } catch {
        // Ignorer
      }

      // Si le visiteur est passé sur le panier ou la commande entre-temps
      const currentPath = window.location.pathname;
      if (
        currentPath.startsWith('/checkout') ||
        currentPath.startsWith('/cart') ||
        currentPath.startsWith('/commande') ||
        currentPath.startsWith('/panier') ||
        currentPath.startsWith('/account/login') ||
        currentPath.startsWith('/account/register') ||
        currentPath.startsWith('/admin')
      ) {
        return;
      }

      // 5. Vérifier si l'application est déjà installée sur l'appareil
      try {
        const isInstalled = await isZorandoAppInstalled();
        if (isInstalled) {
          // L'application est déjà installée, on n'affiche pas le pop-up
          return;
        }
      } catch (err) {
        // Si la détection échoue ou est indisponible, l'état reste inconnu : on affiche le pop-up normalement
        console.debug('[AppDownloadModal] Détection indisponible, affichage normal:', err);
      }

      setIsOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [location.pathname, isRestrictedRoute]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignorer
    }
    setIsOpen(false);
  };

  const handleDownload = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignorer
    }
    setIsOpen(false);
  };

  if (!isOpen || isRestrictedRoute) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-popup-title"
      onClick={handleDismiss}
    >
      {/* Conteneur principal du pop-up - Arrête la propagation des clics vers l'arrière-plan */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white rounded-3xl p-6 sm:p-7 border border-orange-500/30 shadow-2xl shadow-orange-950/50 transform transition-all duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lueur subtile orange en haut */}
        <div 
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-orange-500/25 rounded-full blur-2xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Bouton de fermeture en haut à droite */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Fermer le pop-up"
        >
          <X size={20} />
        </button>

        {/* En-tête avec Badge ZORANDO & Android */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-orange-500/30 shrink-0">
            Z
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] uppercase tracking-wider mb-0.5">
              Application Officielle
            </span>
            <div className="font-extrabold text-white text-base tracking-tight">ZORANDO Algérie</div>
          </div>
        </div>

        {/* Titre exact demandé */}
        <h3 
          id="app-popup-title"
          className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug"
        >
          Vos achats préférés, toujours à portée de main !
        </h3>

        {/* Description exacte demandée */}
        <p className="mt-2.5 text-sm text-gray-300 leading-relaxed">
          Téléchargez l'application ZORANDO et découvrez nos produits à prix abordables, où que vous soyez.
        </p>

        {/* Liste des avantages demandés */}
        <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-left">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-200">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <span className="font-medium">Découvrez nos nouveautés facilement</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-200">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Heart size={14} />
            </div>
            <span className="font-medium">Retrouvez vos produits préférés</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-200">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Truck size={14} />
            </div>
            <span className="font-medium">Livraison dans les 58 wilayas</span>
          </div>
        </div>

        {/* Bouton principal : TÉLÉCHARGER GRATUITEMENT */}
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/40"
        >
          {/* Logo officiel Google Play */}
          <svg 
            className="w-5 h-5 shrink-0" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3.609 1.814L13.793 12 3.61 22.186c-.378-.403-.61-.958-.61-1.586V3.4c0-.628.232-1.183.61-1.586z" fill="#4285F4"/>
            <path d="M17.18 8.613L13.793 12l3.387 3.387 3.826-2.18c.904-.516.904-1.878 0-2.394l-3.826-2.2z" fill="#FBBC04"/>
            <path d="M13.793 12L3.609 1.814c.266-.285.642-.464 1.066-.464.398 0 .762.158 1.042.318l11.463 6.945L13.793 12z" fill="#00E676"/>
            <path d="M13.793 12l3.387 3.387-11.463 6.945c-.28.16-.644.318-1.042.318-.424 0-.8-.179-1.066-.464L13.793 12z" fill="#FF3D00"/>
          </svg>
          <span className="tracking-wide">TÉLÉCHARGER GRATUITEMENT</span>
        </a>

        {/* Mention sous le bouton */}
        <p className="mt-2 text-center text-xs text-gray-400 font-medium">
          Disponible sur Google Play
        </p>

        {/* Bouton secondaire */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full mt-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white active:text-gray-200 transition-colors focus:outline-none"
        >
          Non merci, je continue sur le site
        </button>
      </div>
    </div>
  );
}
