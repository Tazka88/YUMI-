import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';

export const YUMI_TOPBAR_CONFIG = {
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
    if (!YUMI_TOPBAR_CONFIG.active || !YUMI_TOPBAR_CONFIG.messages || YUMI_TOPBAR_CONFIG.messages.length === 0) {
      return;
    }

    const closedUntil = localStorage.getItem('yumi_topbar_closed_until');
    if (closedUntil && parseInt(closedUntil) > Date.now()) {
      return;
    }

    setIsVisible(true);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % YUMI_TOPBAR_CONFIG.messages.length);
    }, YUMI_TOPBAR_CONFIG.rotationSpeed);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('yumi_topbar_closed_until', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const bgStyle = YUMI_TOPBAR_CONFIG.backgroundGradient 
    ? `linear-gradient(to right, ${YUMI_TOPBAR_CONFIG.backgroundColor}, ${YUMI_TOPBAR_CONFIG.backgroundGradient})`
    : YUMI_TOPBAR_CONFIG.backgroundColor;

  const mobileHiddenClass = !YUMI_TOPBAR_CONFIG.showOnMobile ? 'yumi-topbar-hide-mobile' : '';

  return (
    <div 
      className={`yumi-topbar-wrapper ${mobileHiddenClass}`}
      style={{ 
        background: bgStyle, 
        color: YUMI_TOPBAR_CONFIG.textColor,
        '--yumi-fs-desktop': YUMI_TOPBAR_CONFIG.fontSizeDesktop,
        '--yumi-fs-mobile': YUMI_TOPBAR_CONFIG.fontSizeMobile
      } as React.CSSProperties}
    >
      <div className="yumi-topbar-inner container mx-auto px-4">
        <div className="yumi-topbar-left">
          {YUMI_TOPBAR_CONFIG.messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`yumi-topbar-message ${idx === currentIndex ? 'yumi-topbar-active' : ''}`}
            >
              {msg}
            </div>
          ))}
        </div>
        <div 
          className="yumi-topbar-right"
          style={{ backgroundColor: YUMI_TOPBAR_CONFIG.phoneBackgroundColor }}
        >
          <a href={`tel:${YUMI_TOPBAR_CONFIG.phoneNumber.replace(/\s/g, '')}`} className="yumi-topbar-phone-container" style={{ color: 'inherit' }}>
            <Phone size={18} className="yumi-topbar-icon-phone" />
            <span className="yumi-topbar-phone-text-desktop">
              {YUMI_TOPBAR_CONFIG.phoneText} : <span style={{ fontWeight: 800, fontSize: '1.05em' }}>{YUMI_TOPBAR_CONFIG.phoneNumber}</span>
            </span>
            <span className="yumi-topbar-phone-text-mobile">
              {YUMI_TOPBAR_CONFIG.phoneTextMobile} <span style={{ fontWeight: 800 }}>{YUMI_TOPBAR_CONFIG.phoneNumber}</span>
            </span>
          </a>
          <button onClick={handleClose} className="yumi-topbar-close" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
