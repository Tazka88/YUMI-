import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  (window as any).__SUPABASE_URL__ = (window as any).__SUPABASE_URL__ || (import.meta as any).env?.VITE_SUPABASE_URL;
  (window as any).__SUPABASE_KEY__ = (window as any).__SUPABASE_KEY__ || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  window.onunhandledrejection = (event) => {
    // Log network/unhandled errors for debugging without showing intrusive toasts to users
    if (event.reason) {
      console.warn('Unhandled rejection caught:', event.reason);
    }
  };
  
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error caught:', message, error);
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
