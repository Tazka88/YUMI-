import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import ReactPixel from 'react-facebook-pixel';

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

        if (gaMeasurementId && ReactGA && typeof ReactGA.initialize === 'function') {
          try {
            ReactGA.initialize(gaMeasurementId);
            setGaId(gaMeasurementId);
          } catch (e) {
            console.error('Failed to initialize GA', e);
          }
        }

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

    if (gaId && ReactGA && typeof ReactGA.send === 'function') {
      try {
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
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
