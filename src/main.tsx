import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.onunhandledrejection = (event) => {
    // Specifically catch "Failed to fetch" errors which are often network-related
    if (event.reason && (event.reason.message === 'Failed to fetch' || event.reason.name === 'TypeError')) {
      console.warn('Network error or Fetch failed caught globally:', event.reason);
      // We could trigger a custom event here if needed
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
