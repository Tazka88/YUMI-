import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: any;
    _fbq: any;
  }
}

export default function Analytics() {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [gaId, setGaId] = useState<string | null>(null);
  const [fbId, setFbId] = useState<string | null>(null);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/settings', { signal: controller.signal })
      .then(data => {
        const gaMeasurementId = (data as any).ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID;
        // Always use the provided Pixel ID
        const fbPixelId = '2110613746362191';

        // GA is now initialized in index.html directly
        setGaId('G-7JLYM1QX3C');

        const isProduction = typeof window !== 'undefined' && window.location.hostname === 'yumidz.vercel.app';
        
        if (fbPixelId && typeof window !== 'undefined' && isProduction) {
          try {
            // Manually inject FB Pixel to have full control over initialization and prevent auto-PageView
            if (!window.fbq) {
              window.fbq = function() {
                window.fbq.callMethod ?
                window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
              };
              if (!window._fbq) window._fbq = window.fbq;
              window.fbq.push = window.fbq;
              window.fbq.loaded = !0;
              window.fbq.version = '2.0';
              window.fbq.queue = [];
              const t = document.createElement('script');
              t.async = !0;
              t.src = 'https://connect.facebook.net/en_US/fbevents.js';
              const s = document.getElementsByTagName('script')[0];
              if (s && s.parentNode) {
                s.parentNode.insertBefore(t, s);
              } else {
                document.head.appendChild(t);
              }
            }
            
            // Initialize without sending PageView automatically
            window.fbq('set', 'autoConfig', false, fbPixelId);
            
            // CRITICAL: Prevent Facebook from automatically tracking PageViews on initialization
            // and on History API changes (React Router)
            window.fbq.disablePushState = true;
            
            // Initialize the pixel but DO NOT send a PageView here.
            // We handle PageView manually in the second useEffect.
            window.fbq('init', fbPixelId);
            setFbId(fbPixelId);
          } catch (e) {
            console.error('Failed to initialize FB Pixel', e);
          }
        }

        setIsInitialized(true);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
      
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const currentPath = location.pathname + location.search;
    if (lastPathRef.current === currentPath) return; // Prevent duplicate page views
    lastPathRef.current = currentPath;

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'page_view', {
          page_path: currentPath
        });
      } catch (e) {
        console.error('Failed to send GA pageview', e);
      }
    }

    if (fbId) {
      try {
        const eventId = generateEventId();
        
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'PageView', {}, { eventID: eventId });
        }
        
        // Send to CAPI
        sendCapiEvent({
          eventName: 'PageView',
          eventId: eventId
        });
      } catch (e) {
        console.error('Failed to send FB pageview', e);
      }
    }
  }, [location, isInitialized, gaId, fbId]);

  return null;
}
