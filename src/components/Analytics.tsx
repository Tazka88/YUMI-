import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';

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

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/settings', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const gaMeasurementId = data.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID;
        const fbPixelId = data.fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID;

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

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'page_view', {
          page_path: location.pathname + location.search
        });
      } catch (e) {
        console.error('Failed to send GA pageview', e);
      }
    }

    if (fbId) {
      try {
        const pixel = (ReactPixel && (ReactPixel as any).default) || ReactPixel;
        if (pixel && typeof pixel.pageView === 'function') {
          pixel.pageView();
        }
      } catch (e) {
        console.error('Failed to send FB pageview', e);
      }
    }
  }, [location, isInitialized, gaId, fbId]);

  return null;
}
