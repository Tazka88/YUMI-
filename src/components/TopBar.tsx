import React, { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

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
  const [isVisible, setIsVisible] = useState(() => {
    if (!ZORANDO_TOPBAR_CONFIG.active) return false;
    const closedUntil = localStorage.getItem('zorando_topbar_closed_until');
    if (closedUntil && parseInt(closedUntil) > Date.now()) {
      return false;
    }
    return true;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settings, fetchSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings().then(() => setIsLoading(false));
  }, [fetchSettings]);

  useEffect(() => {
    if (isLoading) return;

    const messages = settings?.announcement_text 
      ? settings.announcement_text.split(/\r?\n/).map((m: string) => m.trim()).filter((m: string) => m.length > 0)
      : ZORANDO_TOPBAR_CONFIG.messages;

    if (!ZORANDO_TOPBAR_CONFIG.active || !messages || messages.length === 0) {
      setIsVisible(false);
      return;
    }

    const closedUntil = localStorage.getItem('zorando_topbar_closed_until');
    if (closedUntil && parseInt(closedUntil) > Date.now()) {
      return;
    }

    setIsVisible(true);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, ZORANDO_TOPBAR_CONFIG.rotationSpeed);

    return () => clearInterval(interval);
  }, [settings, isLoading]);

  if (!isVisible) return null;

  const messages = settings?.announcement_text 
    ? settings.announcement_text.split(/\r?\n/).map((m: string) => m.trim()).filter((m: string) => m.length > 0)
    : ZORANDO_TOPBAR_CONFIG.messages;

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('zorando_topbar_closed_until', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const backgroundColor = settings?.announcement_bg_color || ZORANDO_TOPBAR_CONFIG.backgroundColor;
  const textColor = settings?.announcement_text_color || ZORANDO_TOPBAR_CONFIG.textColor;
  const phoneNumber = settings?.announcement_phone || ZORANDO_TOPBAR_CONFIG.phoneNumber;

  const bgStyle = backgroundColor;

  const mobileHiddenClass = !ZORANDO_TOPBAR_CONFIG.showOnMobile ? 'zorando-topbar-hide-mobile' : '';

  return (
    <div 
      className={`zorando-topbar-wrapper ${mobileHiddenClass}`}
      style={{ 
        background: bgStyle, 
        color: textColor,
        '--zorando-fs-desktop': ZORANDO_TOPBAR_CONFIG.fontSizeDesktop,
        '--zorando-fs-mobile': ZORANDO_TOPBAR_CONFIG.fontSizeMobile
      } as React.CSSProperties}
    >
      <div className="zorando-topbar-inner container mx-auto px-4">
        <div className="zorando-topbar-left">
          {messages.map((msg: string, idx: number) => (
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
          <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="zorando-topbar-phone-container" style={{ color: 'inherit' }}>
            <Phone size={18} className="zorando-topbar-icon-phone" />
            <span className="zorando-topbar-phone-text-desktop">
              {ZORANDO_TOPBAR_CONFIG.phoneText} : <span style={{ fontWeight: 800, fontSize: '1.05em' }}>{phoneNumber}</span>
            </span>
            <span className="zorando-topbar-phone-text-mobile">
              {ZORANDO_TOPBAR_CONFIG.phoneTextMobile} <span style={{ fontWeight: 800 }}>{phoneNumber}</span>
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
