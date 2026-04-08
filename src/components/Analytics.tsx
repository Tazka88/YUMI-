import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
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
        const gaMeasurementId = data.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID;
        // Always use the provided Pixel ID
        const fbPixelId = '2110613746362191';

        // GA is now initialized in index.html directly
        setGaId('G-7JLYM1QX3C');

        if (fbPixelId) {
          try {
            // Handle different import resolutions for CommonJS in Vite
            const pixel = (ReactPixel && (ReactPixel as any).default) || ReactPixel;
            if (pixel && typeof pixel.init === 'function') {
              pixel.init(fbPixelId);
              setFbId(fbPixelId);
            }
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
        const pixel = (ReactPixel && (ReactPixel as any).default) || ReactPixel;
        if (pixel && typeof pixel.pageView === 'function') {
          // ReactPixel.pageView() doesn't accept eventID directly in this library version, 
          // but we can use trackCustom or track with eventID if supported.
          // The library might not support eventID on pageView, so we use track('PageView')
          pixel.track('PageView', {}, { eventID: eventId });
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
