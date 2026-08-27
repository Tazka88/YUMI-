import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {toast} from 'react-hot-toast';

if (typeof window !== 'undefined') {
  window.onunhandledrejection = (event) => {
    // Specifically catch "Failed to fetch" errors which are often network-related
    if (event.reason && (event.reason.message === 'Failed to fetch' || event.reason.name === 'TypeError')) {
      console.warn('Network error or Fetch failed caught globally:', event.reason);
      toast.error('Erreur de connexion : Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
  };
  
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error caught:', message, error);
    if (message.toString().includes('Script error')) {
      // Ignore cross-origin script errors which are usually benign
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
