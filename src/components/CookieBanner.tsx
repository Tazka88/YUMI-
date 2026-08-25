import React, { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted cookies
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    // 1. Save consent
    localStorage.setItem('cookie_consent', 'true');
    
    // 2. Update GTM consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }

    // 3. Force load GTM script if it hasn't been loaded yet by interaction
    if (typeof window !== 'undefined' && (window as any).loadGTM) {
      (window as any).loadGTM();
    }
    
    // 4. Hide banner
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-2xl z-[9999] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm">
        <p>
          En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de cookies pour vous proposer des services et offres adaptés à vos centres d'intérêts.
        </p>
      </div>
      <div className="flex-shrink-0">
        <button 
          onClick={handleAcceptCookies}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-bold transition-colors whitespace-nowrap"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
