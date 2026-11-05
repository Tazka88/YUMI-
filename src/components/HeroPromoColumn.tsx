import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Truck, Smartphone, ChevronRight, ShieldCheck, Download, ArrowUpRight } from 'lucide-react';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.zorando.app';

export default function HeroPromoColumn() {
  return (
    <aside 
      aria-label="Avantages et offres ZORANDO"
      className="hidden lg:flex flex-col w-[230px] xl:w-[250px] shrink-0 gap-3 justify-between self-stretch select-none"
    >
      {/* 1. Carte Bons Plans */}
      <Link
        to="/category/all?promo=true"
        className="flex-1 bg-gradient-to-br from-white via-orange-50/30 to-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md hover:border-[#FF6B00]/40 transition-all duration-300 flex flex-col justify-between group active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF6B00] group-hover:text-white transition-all duration-300 shrink-0">
            <Flame size={19} className="transition-transform group-hover:rotate-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B00] text-white px-2 py-0.5 rounded-full shadow-xs">
            Bons Plans
          </span>
        </div>

        <div className="my-2">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF6B00] transition-colors leading-tight">
            Offres Spéciales
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            Découvrez nos meilleures offres et remises exclusives.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-100/70 text-[11px] font-bold text-[#FF6B00]">
          <span>Voir les offres</span>
          <div className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:text-white transition-all">
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* 2. Carte Livraison 58 Wilayas */}
      <Link
        to="/category/all"
        className="flex-1 bg-gradient-to-br from-white via-neutral-50/50 to-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF6B00] transition-all duration-300 shrink-0">
            <Truck size={18} className="transition-transform group-hover:translate-x-0.5" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-neutral-900 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <ShieldCheck size={11} className="text-[#FF6B00]" />
            58 Wilayas
          </span>
        </div>

        <div className="my-2">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF6B00] transition-colors leading-tight">
            Livraison Express
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            Livraison dans les 58 wilayas avec paiement à la réception.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-100/70 text-[11px] font-bold text-gray-800 group-hover:text-[#FF6B00]">
          <span>Commander en sécurité</span>
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:text-white transition-all">
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* 3. Carte Application ZORANDO */}
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 bg-gradient-to-br from-neutral-950 via-neutral-900 to-gray-900 text-white rounded-2xl p-4 border border-neutral-800 shadow-xs hover:shadow-md hover:border-[#FF6B00]/50 transition-all duration-300 flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden"
      >
        {/* Glow discret */}
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-orange-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-[#FF6B00] border border-orange-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF6B00] group-hover:text-white transition-all duration-300 shrink-0">
            <Smartphone size={18} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Download size={10} />
            Android
          </span>
        </div>

        <div className="my-2 relative z-10">
          <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors leading-tight">
            Application ZORANDO
          </h3>
          <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
            Découvrez l'application ZORANDO pour commander plus vite.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] font-bold text-orange-400 group-hover:text-orange-300 relative z-10">
          <span>Installer l'application</span>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#FF6B00] group-hover:text-white transition-all">
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </a>
    </aside>
  );
}
