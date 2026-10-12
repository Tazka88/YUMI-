import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  const metaUrl = document.querySelector('meta[name="supabase-url"]')?.getAttribute('content');
  const metaKey = document.querySelector('meta[name="supabase-key"]')?.getAttribute('content');
  if (metaUrl && !metaUrl.includes('%VITE_')) (window as any).__SUPABASE_URL__ = metaUrl;
  if (metaKey && !metaKey.includes('%VITE_')) (window as any).__SUPABASE_KEY__ = metaKey;
  (window as any).__SUPABASE_URL__ = (window as any).__SUPABASE_URL__ || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://evvbhalgyffagsesmvhu.supabase.co';
  (window as any).__SUPABASE_KEY__ = (window as any).__SUPABASE_KEY__ || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmJoYWxneWZmYWdzZXNtdmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Nzc2MDMsImV4cCI6MjA4OTQ1MzYwM30.gL5FtiWtgIDLWXQJZnWbaOK9XY4voUQrfFLf5EaA2v4';

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
