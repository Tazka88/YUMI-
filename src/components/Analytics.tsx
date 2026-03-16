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
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const gaMeasurementId = data.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID;
        const fbPixelId = data.fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID;

        if (gaMeasurementId) {
          ReactGA.initialize(gaMeasurementId);
          setGaId(gaMeasurementId);
        }

        if (fbPixelId) {
          ReactPixel.init(fbPixelId);
          setFbId(fbPixelId);
        }

        setIsInitialized(true);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (gaId) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }

    if (fbId) {
      ReactPixel.pageView();
    }
  }, [location, isInitialized, gaId, fbId]);

  return null;
}
