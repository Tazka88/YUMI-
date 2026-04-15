import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

export const ZORANDO_TOPBAR_CONFIG = {
  active: true,
  backgroundColor: "#00A651",
  backgroundGradient: "#00C25E",
  textColor: "#FFFFFF", 
  phoneBackgroundColor: "#F68B1E", // Orange Jumia style
  fontSizeDesktop: "15px",
  fontSizeMobile: "13px",
  messages: [
    "🔥 -70% Printemps + Livraison gratuite dès 5000 DA",
    "🚚 Livraison 58 Wilayas en 24-48h",
    "💳 Paiement à la livraison 100% sécurisé"
  ],
  phoneNumber: "0781955925",
  phoneText: "Appelez pour commander",
  phoneTextMobile: "Commandez au",
  showOnMobile: true,
  rotationSpeed: 5000
};

export default function TopBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!ZORANDO_TOPBAR_CONFIG.active || !ZORANDO_TOPBAR_CONFIG.messages || ZORANDO_TOPBAR_CONFIG.messages.length === 0) {
      return;
    }

    const closedUntil = localStorage.getItem('zorando_topbar_closed_until');
    if (closedUntil && parseInt(closedUntil) > Date.now()) {
      return;
    }

    setIsVisible(true);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ZORANDO_TOPBAR_CONFIG.messages.length);
    }, ZORANDO_TOPBAR_CONFIG.rotationSpeed);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('zorando_topbar_closed_until', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const bgStyle = ZORANDO_TOPBAR_CONFIG.backgroundGradient 
    ? `linear-gradient(to right, ${ZORANDO_TOPBAR_CONFIG.backgroundColor}, ${ZORANDO_TOPBAR_CONFIG.backgroundGradient})`
    : ZORANDO_TOPBAR_CONFIG.backgroundColor;

  const mobileHiddenClass = !ZORANDO_TOPBAR_CONFIG.showOnMobile ? 'zorando-topbar-hide-mobile' : '';

  return (
    <div 
      className={`zorando-topbar-wrapper ${mobileHiddenClass}`}
      style={{ 
        background: bgStyle, 
        color: ZORANDO_TOPBAR_CONFIG.textColor,
        '--zorando-fs-desktop': ZORANDO_TOPBAR_CONFIG.fontSizeDesktop,
        '--zorando-fs-mobile': ZORANDO_TOPBAR_CONFIG.fontSizeMobile
      } as React.CSSProperties}
    >
      <div className="zorando-topbar-inner container mx-auto px-4">
        <div className="zorando-topbar-left">
          {ZORANDO_TOPBAR_CONFIG.messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`zorando-topbar-message ${idx === currentIndex ? 'zorando-topbar-active' : ''}`}
            >
              {msg}
            </div>
          ))}
        </div>
        <div 
          className="zorando-topbar-right"
          style={{ backgroundColor: ZORANDO_TOPBAR_CONFIG.phoneBackgroundColor }}
        >
          <a href={`tel:${ZORANDO_TOPBAR_CONFIG.phoneNumber.replace(/\s/g, '')}`} className="zorando-topbar-phone-container" style={{ color: 'inherit' }}>
            <Phone size={18} className="zorando-topbar-icon-phone" />
            <span className="zorando-topbar-phone-text-desktop">
              {ZORANDO_TOPBAR_CONFIG.phoneText} : <span style={{ fontWeight: 800, fontSize: '1.05em' }}>{ZORANDO_TOPBAR_CONFIG.phoneNumber}</span>
            </span>
            <span className="zorando-topbar-phone-text-mobile">
              {ZORANDO_TOPBAR_CONFIG.phoneTextMobile} <span style={{ fontWeight: 800 }}>{ZORANDO_TOPBAR_CONFIG.phoneNumber}</span>
            </span>
          </a>
          <button onClick={handleClose} className="zorando-topbar-close" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
