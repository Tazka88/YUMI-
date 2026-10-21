import React from 'react';
import { Smartphone, Zap, Bell, PackageCheck, Star, ShieldCheck } from 'lucide-react';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.zorando.app';

export default function AppDownloadBanner() {
  return (
    <section 
      aria-label="Télécharger l'application ZORANDO"
      className="my-8 sm:my-12 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white border border-gray-800 shadow-xl relative"
    >
      {/* Subtle brand glow effects */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 px-4 py-8 sm:px-8 sm:py-10 md:py-12 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-semibold w-fit mx-auto lg:mx-0 mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Application Officielle Android</span>
              <span className="text-gray-400">|</span>
              <span className="flex items-center gap-1 text-yellow-400">
                <Star size={13} fill="currentColor" />
                <span>4.8 / 5</span>
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Téléchargez l'application <span className="text-orange-500">ZORANDO</span>
            </h2>

            {/* Description */}
            <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Faites vos achats plus rapidement, profitez d'offres exclusives et suivez vos colis en direct. Livraison rapide sur 58 wilayas avec paiement à la réception.
            </p>

            {/* Benefit highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 my-5 sm:my-6 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Zap size={15} />
                </div>
                <span className="text-xs font-semibold text-gray-200">Achat ultra rapide</span>
              </div>

              <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Bell size={15} />
                </div>
                <span className="text-xs font-semibold text-gray-200">Promos exclusives</span>
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <PackageCheck size={15} />
                </div>
                <span className="text-xs font-semibold text-gray-200">Suivi en direct</span>
              </div>
            </div>

            {/* Action buttons & QR Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-1">
              {/* Orange Google Play CTA Button */}
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-orange-500/40"
              >
                {/* Google Play Authentic Icon */}
                <svg 
                  className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3.609 1.814L13.793 12 3.61 22.186c-.378-.403-.61-.958-.61-1.586V3.4c0-.628.232-1.183.61-1.586z" fill="#4285F4"/>
                  <path d="M17.18 8.613L13.793 12l3.387 3.387 3.826-2.18c.904-.516.904-1.878 0-2.394l-3.826-2.2z" fill="#FBBC04"/>
                  <path d="M13.793 12L3.609 1.814c.266-.285.642-.464 1.066-.464.398 0 .762.158 1.042.318l11.463 6.945L13.793 12z" fill="#00E676"/>
                  <path d="M13.793 12l3.387 3.387-11.463 6.945c-.28.16-.644.318-1.042.318-.424 0-.8-.179-1.066-.464L13.793 12z" fill="#FF3D00"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-orange-100">DISPONIBLE SUR</span>
                  <span className="font-extrabold text-white text-base">Google Play</span>
                </div>
              </a>

              {/* QR Code hint for Desktop */}
              <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-left">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=ffffff&bgcolor=111827&data=${encodeURIComponent(GOOGLE_PLAY_URL)}`}
                  alt="QR Code ZORANDO Google Play"
                  width="44"
                  height="44"
                  className="rounded-lg bg-gray-900 border border-gray-700 p-0.5"
                  loading="lazy"
                />
                <div className="text-xs">
                  <div className="font-bold text-gray-200">Scannez le QR Code</div>
                  <div className="text-[11px] text-gray-400">Installez directement sur Android</div>
                </div>
              </div>
            </div>

            {/* Trust disclaimer */}
            <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
              <ShieldCheck size={14} className="text-orange-400" />
              <span>100% Gratuit • Sécurisé • Compatible avec tous les téléphones Android</span>
            </div>
          </div>

          {/* Right Visual Column (Phone Mockup) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
              
              {/* Phone Frame Mockup */}
              <div className="relative mx-auto border-4 border-gray-800 bg-gray-950 rounded-[2.5rem] shadow-2xl p-2.5 overflow-hidden">
                {/* Speaker notch */}
                <div className="w-20 h-3.5 bg-gray-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-gray-900 rounded-full mr-2" />
                  <div className="w-8 h-1 bg-gray-700 rounded-full" />
                </div>

                {/* Simulated Screen */}
                <div className="bg-gray-900 rounded-[2rem] p-3 text-white border border-gray-800/80 shadow-inner">
                  {/* App Status bar */}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 mb-2">
                    <span className="font-bold text-white">09:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-orange-400">4G</span>
                      <div className="w-4 h-2 rounded-xs border border-gray-400 p-0.5 flex items-center">
                        <div className="w-full h-full bg-orange-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center font-black text-xs text-white">
                        Z
                      </div>
                      <span className="font-extrabold text-sm tracking-tight">ZORANDO</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                      PROMOS
                    </span>
                  </div>

                  {/* App Mini Hero Banner */}
                  <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-3 text-white mb-2 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-100">Offre Exclusive App</div>
                    <div className="text-sm font-black leading-tight mt-0.5">Jusqu'à -50% sur l'app !</div>
                    <div className="mt-1.5 inline-block bg-black/30 backdrop-blur-xs text-[9px] font-bold px-2 py-0.5 rounded-md">
                      Code : APP50
                    </div>
                  </div>

                  {/* Product Cards Preview */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gray-800/90 rounded-lg p-2 border border-gray-700/60">
                      <div className="h-14 rounded-md bg-gray-700/60 flex items-center justify-center text-xl mb-1.5">
                        👟
                      </div>
                      <div className="text-[10px] font-bold text-white truncate">Sneakers Air</div>
                      <div className="text-[10px] text-orange-400 font-extrabold mt-0.5">4 900 DA</div>
                    </div>

                    <div className="bg-gray-800/90 rounded-lg p-2 border border-gray-700/60">
                      <div className="h-14 rounded-md bg-gray-700/60 flex items-center justify-center text-xl mb-1.5">
                        🎧
                      </div>
                      <div className="text-[10px] font-bold text-white truncate">Casque Bluetooth</div>
                      <div className="text-[10px] text-orange-400 font-extrabold mt-0.5">3 200 DA</div>
                    </div>
                  </div>

                  {/* App Bottom CTA */}
                  <a
                    href={GOOGLE_PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Ouvrir dans Google Play →
                  </a>
                </div>
              </div>

              {/* Floating notification badge (Desktop/Tablet only, positioned at top to avoid any overlap with button) */}
              <div className="hidden sm:flex absolute -top-3 -right-4 bg-gray-900/95 backdrop-blur-md border border-orange-500/40 text-white p-2.5 rounded-2xl shadow-xl items-center gap-2.5 pointer-events-none z-20">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Smartphone size={16} />
                </div>
                <div className="text-left pr-1">
                  <div className="text-[10px] text-gray-400">Application Android</div>
                  <div className="text-xs font-bold text-orange-400">ZORANDO E-Commerce</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
