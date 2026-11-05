import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Truck, Smartphone, ChevronRight, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import promoBonsPlansImg from '../assets/images/promo_bons_plans_1793872367769.jpg';
import promoLivraisonImg from '../assets/images/promo_livraison_express_1793872381621.jpg';
import promoAppImg from '../assets/images/promo_app_mobile_1793872410959.jpg';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.zorando.app';

export default function HeroPromoColumn() {
  return (
    <aside 
      aria-label="Avantages et offres ZORANDO"
      className="hidden lg:flex flex-col w-[240px] xl:w-[260px] shrink-0 gap-3 justify-between self-stretch select-none"
    >
      {/* 1. Carte Bons Plans avec Image */}
      <Link
        to="/category/all?promo=true"
        className="flex-1 min-h-[115px] xl:min-h-[125px] relative rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:border-[#FF6B00]/70 transition-all duration-300 flex flex-col justify-between p-3.5 group active:scale-[0.98]"
      >
        {/* Background Image */}
        <img 
          src={promoBonsPlansImg} 
          alt="Bons Plans ZORANDO" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Contrast Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 group-hover:via-black/50 transition-colors duration-300 pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B00] text-white px-2 py-0.5 rounded-full shadow-md">
            <Flame size={12} className="animate-pulse" />
            Bons Plans
          </span>
          <span className="text-[10px] font-bold text-orange-200 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded border border-white/10">
            Jusqu'à -70%
          </span>
        </div>

        {/* Content Body */}
        <div className="relative z-10 my-1">
          <h3 className="font-extrabold text-white text-sm group-hover:text-orange-300 transition-colors leading-tight drop-shadow-sm">
            Offres Spéciales
          </h3>
          <p className="text-[11px] text-gray-200 mt-0.5 line-clamp-1 leading-snug font-medium drop-shadow-xs">
            Découvrez nos meilleures réductions
          </p>
        </div>

        {/* Bottom Action Footer */}
        <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/15 text-[11px] font-bold text-white group-hover:text-orange-300">
          <span className="flex items-center gap-1">Profiter des offres</span>
          <div className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* 2. Carte Livraison 58 Wilayas avec Image */}
      <Link
        to="/category/all"
        className="flex-1 min-h-[115px] xl:min-h-[125px] relative rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:border-orange-400/70 transition-all duration-300 flex flex-col justify-between p-3.5 group active:scale-[0.98]"
      >
        {/* Background Image */}
        <img 
          src={promoLivraisonImg} 
          alt="Livraison 58 Wilayas ZORANDO" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Contrast Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 group-hover:via-black/50 transition-colors duration-300 pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-neutral-900 px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs">
            <Truck size={12} className="text-[#FF6B00]" />
            58 Wilayas
          </span>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 backdrop-blur-xs px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck size={10} />
            Paiement Réception
          </span>
        </div>

        {/* Content Body */}
        <div className="relative z-10 my-1">
          <h3 className="font-extrabold text-white text-sm group-hover:text-orange-200 transition-colors leading-tight drop-shadow-sm">
            Livraison Express
          </h3>
          <p className="text-[11px] text-gray-200 mt-0.5 line-clamp-1 leading-snug font-medium drop-shadow-xs">
            Directement à votre porte partout en Algérie
          </p>
        </div>

        {/* Bottom Action Footer */}
        <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/15 text-[11px] font-bold text-white group-hover:text-orange-200">
          <span className="flex items-center gap-1">Commander en sécurité</span>
          <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:bg-[#FF6B00] shadow-xs group-hover:scale-110 transition-all">
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* 3. Carte Application ZORANDO avec Image */}
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-h-[115px] xl:min-h-[125px] relative rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-xl hover:border-[#FF6B00]/70 transition-all duration-300 flex flex-col justify-between p-3.5 group active:scale-[0.98]"
      >
        {/* Background Image */}
        <img 
          src={promoAppImg} 
          alt="Application Mobile ZORANDO" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Contrast Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/35 group-hover:via-black/50 transition-colors duration-300 pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-md">
            <Smartphone size={11} />
            Application
          </span>
          <span className="text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur-xs px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
            <Sparkles size={10} className="text-yellow-300" />
            Gratuite
          </span>
        </div>

        {/* Content Body */}
        <div className="relative z-10 my-1">
          <h3 className="font-extrabold text-white text-sm group-hover:text-orange-300 transition-colors leading-tight drop-shadow-sm">
            App ZORANDO
          </h3>
          <p className="text-[11px] text-gray-200 mt-0.5 line-clamp-1 leading-snug font-medium drop-shadow-xs">
            Commandes rapides & notifications promos
          </p>
        </div>

        {/* Bottom Action Footer */}
        <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/15 text-[11px] font-bold text-orange-300 group-hover:text-orange-200">
          <span className="flex items-center gap-1">Installer l'application</span>
          <div className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </a>
    </aside>
  );
}
