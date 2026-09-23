import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {toast} from 'react-hot-toast';

if (typeof window !== 'undefined') {
  // Capacitor safety guard if loaded in Android WebView
  const win = window as any;
  if (!win.Capacitor) {
    win.Capacitor = {
      triggerEvent: (eventName: string, target?: string, data?: any) => {
        try {
          const targetObj = target === 'document' ? document : window;
          targetObj.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        } catch {}
      },
      isPluginAvailable: () => false,
      getPlatform: () => 'android',
      isNativePlatform: () => true
    };
  } else if (typeof win.Capacitor.triggerEvent !== 'function') {
    win.Capacitor.triggerEvent = (eventName: string, target?: string, data?: any) => {
      try {
        const targetObj = target === 'document' ? document : window;
        targetObj.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      } catch {}
    };
  }

  window.onunhandledrejection = (event) => {
    // Specifically catch "Failed to fetch" errors which are often network-related
    if (event.reason && (event.reason.message === 'Failed to fetch' || event.reason.name === 'TypeError')) {
      console.warn('Network error or Fetch failed caught globally:', event.reason);
      toast.error('Erreur de connexion : Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
  };
  
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error caught:', message, error);
    const msgStr = message ? message.toString() : '';
    if (msgStr.includes('Script error') || msgStr.includes('triggerEvent')) {
      // Ignore cross-origin script errors or native WebView bridge triggerEvent calls
      return;
    }
    // Only Toast once to avoid spam
    toast.error('Une erreur technique est survenue. L\'application peut rencontrer des problèmes.');
  };
}

// Nettoyer les balises SEO injectées par le SSR avant que React 19 ne les injecte à nouveau
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-rh="true"]').forEach(el => el.remove());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
