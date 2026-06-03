import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Battery,
  Droplets,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Scissors,
  Star,
  Menu,
  X,
  PlayCircle,
  Truck,
  Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductLinkContext = React.createContext('/product/philips-oneblade-360-qp2824');

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const productUrl = React.useContext(ProductLinkContext);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <span className="text-2xl font-bold tracking-tighter text-white">
                One<span className="text-[#C5D600]">Blade</span>
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Caractéristiques</a>
              <a href="#accessories" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dans la boîte</a>
              
              <div className="flex items-center ml-4 pl-8 border-l border-slate-700 h-10">
                <div className={`flex flex-col text-right transition-all duration-500 overflow-hidden ${scrolled ? 'opacity-100 max-w-[200px] mr-4' : 'opacity-0 max-w-0 mr-0'}`}>
                  <span className="text-white font-bold tracking-tight whitespace-nowrap leading-tight">9 400 DA</span>
                  <span className="text-[#C5D600] text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">Paiement à la livraison</span>
                </div>
                <Link to={productUrl} className="px-6 py-2.5 bg-[#C5D600] text-slate-900 font-bold rounded-full hover:bg-lime-400 transition-all shadow-[0_0_20px_rgba(197,214,0,0.3)] hover:shadow-[0_0_30px_rgba(197,214,0,0.5)] whitespace-nowrap">
                  Commander
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-300 hover:text-white"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
              <a href="#features" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">Caractéristiques</a>
              <a href="#accessories" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">Dans la boîte</a>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Sticky Bottom Banner */}
      <div className={`md:hidden fixed bottom-5 left-4 right-4 z-50 transition-all duration-500 ${scrolled ? 'translate-y-0 opacity-100 visible' : 'translate-y-20 opacity-0 invisible'}`}>
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg leading-none">9 400 DA</span>
            <span className="text-[#C5D600] text-[10px] uppercase font-bold tracking-wider mt-1">Livraison 58 Wilayas</span>
          </div>
          <Link to={productUrl} className="px-5 py-2.5 bg-[#C5D600] text-slate-900 font-bold rounded-xl hover:bg-lime-400 transition-all shadow-[0_0_20px_rgba(197,214,0,0.3)] shadow-[#C5D600]/20 text-sm">
            Commander
          </Link>
        </div>
      </div>
    </>
  );
}

function Hero() {
  const productUrl = React.useContext(ProductLinkContext);
  return (
    <section className="relative overflow-hidden bg-slate-900 min-h-screen flex items-center pt-20">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C5D600] rounded-full mix-blend-screen filter blur-[200px] opacity-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-700 rounded-full filter blur-[150px] opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid lg:grid-cols-2 gap-12 items-center py-12 lg:py-24">
        
        {/* Left Content */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-sm font-semibold text-slate-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#C5D600] animate-pulse"></span>
            Édition Visage + Corps 360
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Taillez, délimitez et rasez <br/>
            <span className="text-[#C5D600]">toutes les longueurs.</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Une technologie unique pour le visage et le corps. La nouvelle lame 360 innovante s'adapte à vos contours pour un rasage confortable, sans coupures ni irritations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
            <Link to={productUrl} className="px-8 py-4 bg-[#C5D600] text-slate-900 font-bold rounded-full hover:bg-lime-400 transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_30px_rgba(197,214,0,0.25)] hover:shadow-[0_0_40px_rgba(197,214,0,0.4)] hover:scale-105 duration-300">
              Commander maintenant <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-full hover:bg-slate-700 transition-all flex items-center justify-center gap-3 text-lg border border-slate-700 hover:border-slate-600">
              <PlayCircle className="w-5 h-5 text-[#C5D600]" /> Voir la vidéo
            </button>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-400 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-[#C5D600] text-[#C5D600]" />)}
              </div>
              <span>Recommandé par 10 000+ hommes</span>
            </div>
          </div>
        </div>

        {/* Right Product Image Area */}
        <div className="order-1 lg:order-2 relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="aspect-[3/4] relative z-10 flex items-center justify-center">
            {/* Main Product Image */}
            <img src="/images/hero.jpg" alt="Philips OneBlade 360 Original Blade" className="w-full h-auto object-contain drop-shadow-2xl z-20 relative rounded-[2rem]" />

            {/* Floating feature badges */}
            <div className="absolute top-10 -left-6 bg-slate-800/90 backdrop-blur-md border border-slate-700 px-5 py-3 rounded-2xl shadow-xl hidden sm:flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
               <div className="bg-[#C5D600]/20 p-2 rounded-full">
                 <RefreshCw className="w-5 h-5 text-[#C5D600]" />
               </div>
               <span className="font-bold text-white text-sm">Lame 360°</span>
            </div>
            
            <div className="absolute bottom-20 -right-6 bg-slate-800/90 backdrop-blur-md border border-slate-700 px-5 py-3 rounded-2xl shadow-xl hidden sm:flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
               <div className="bg-blue-500/20 p-2 rounded-full">
                 <Droplets className="w-5 h-5 text-blue-400" />
               </div>
               <div className="flex flex-col">
                 <span className="font-bold text-white text-sm">100% Étanche</span>
                 <span className="text-xs text-slate-400">Wet & Dry</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: <RefreshCw className="w-7 h-7 text-[#C5D600]" />,
      title: "Lame 360 Innovante",
      description: "Bouge dans toutes les directions et s'adapte à chaque courbe de votre visage. Un rasage et une taille faciles avec moins de passages."
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-[#C5D600]" />,
      title: "Double Protection",
      description: "Un revêtement lisse et des bords arrondis pour un rasage confortable. Fini les coupures et les irritations, même sur les zones sensibles."
    },
    {
      icon: <Scissors className="w-7 h-7 text-[#C5D600]" />,
      title: "Visage et Corps",
      description: "L'outil unique pour tout faire. Sabots dédiés pour tailler votre barbe, styliser vos contours ou entretenir votre corps."
    },
    {
      icon: <Droplets className="w-7 h-7 text-[#C5D600]" />,
      title: "100% Étanche (IPX7)",
      description: "Utilisable sur peau sèche ou humide, avec ou sans mousse à raser, et même sous la douche pour un gain de temps."
    }
  ];

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold text-[#C5D600] tracking-widest uppercase mb-3">La technologie OneBlade</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Conçu pour couper les poils, pas la peau.</h3>
          <p className="text-lg text-slate-600">
            Passez au niveau supérieur avec notre technologie brevetée qui révolutionne votre routine de soin masculine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 hover:shadow-xl hover:shadow-slate-200">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Product feature illustration */}
        <div className="mt-16 w-full max-w-4xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100">
          <img src="/images/features-map.jpg" alt="Caractéristiques du QP2824" className="w-full h-auto object-cover" />
        </div>
      </div>
    </section>
  );
}

function InTheBox() {
  return (
    <section id="accessories" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute right-0 top-0 w-1/3 h-full bg-[#C5D600]/5 -skew-x-12 transform origin-top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold text-[#C5D600] tracking-widest uppercase mb-3">Pack Complet</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-8">Tout ce dont vous avez besoin dans une seule boîte.</h3>
            
            <p className="text-xl text-slate-400 mb-10">
              Équipez-vous du QP2824. Des lames innovantes aux multiples sabots de précision, prenez le contrôle total de votre style.
            </p>

            <ul className="space-y-5">
              {[
                "1x Manche OneBlade ergonomique",
                "1x Lame 360 innovante pour le visage",
                "1x Lame supplémentaire pour le corps",
                "1x Protection zones sensibles clipsable",
                "1x Sabot pour le corps clipsable",
                "3x Sabots barbe de 3 jours (1, 3, 5 mm)",
                "1x Câble de charge USB-A"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="bg-[#C5D600] p-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                  </div>
                  <span className="text-lg font-medium text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C5D600]/20 to-transparent blur-3xl opacity-50 rounded-full" />
            
            <div className="relative z-20 bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img src="/images/box.jpg" alt="Ce qu'il y a dans la boîte" className="w-full h-auto object-cover" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center hover:border-[#C5D600]/50 transition-colors">
                <ShieldCheck className="w-8 h-8 text-[#C5D600] mb-2" />
                <h4 className="font-bold text-base mb-1">Skin Guard</h4>
                <p className="text-xs text-slate-400">Inclus</p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center hover:border-[#C5D600]/50 transition-colors">
                <RefreshCw className="w-8 h-8 text-[#C5D600] mb-2" />
                <h4 className="font-bold text-base mb-1">Lame 360</h4>
                <p className="text-xs text-slate-400">Inclus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InnovativeBladeSection() {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
            <img src="/images/blade-360.jpg" alt="Lame 360 Innovante" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-[#C5D600] font-bold tracking-widest uppercase mb-3">Innovation 360°</h2>
            <h3 className="text-4xl md:text-5xl font-bold mb-6">S'adapte à chaque courbe.</h3>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              La lame 360 innovante bouge dans toutes les directions pour maintenir un contact constant avec la peau, offrant un confort optimal et un contrôle total sur les contours complexes de votre visage et de votre corps.
            </p>
            <ul className="space-y-6">
              <li className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#C5D600] text-slate-900 flex items-center justify-center shrink-0 shadow-lg">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Flexibilité maximale</h4>
                  <p className="text-sm text-slate-400">Pivote dans toutes les directions</p>
                </div>
              </li>
              <li className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#C5D600] text-slate-900 flex items-center justify-center shrink-0 shadow-lg">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Moins de passages</h4>
                  <p className="text-sm text-slate-400">Pour un rasage plus rapide et confortable</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function BodyGroomingSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[#C5D600] font-bold tracking-widest uppercase mb-3">Soin du Corps Complet</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Protégez les zones sensibles.</h3>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Le OneBlade n'est pas seulement pour votre visage. Utilisez le sabot corps dédié pour tailler les poils, ou clipsez le "Skin Guard" exclusif pour raser en toute sécurité sous les aisselles et autres zones sensibles.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[#C5D600]">
                  <Scissors className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Sabot corps</h4>
                <p className="text-sm text-slate-500">Pour une taille parfaite du corps (3 mm).</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[#C5D600]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Skin Guard</h4>
                <p className="text-sm text-slate-500">Protection supplémentaire pour les zones intimes.</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 group">
            <img src="/images/usage-body.jpg" alt="Soin du corps avec OneBlade" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem] pointer-events-none" />
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <ShieldCheck className="w-8 h-8 text-[#C5D600]" />
              <div className="flex flex-col">
                <span className="font-bold text-slate-900">100% Sûr</span>
                <span className="text-xs text-slate-500">Sur zones sensibles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  const productUrl = React.useContext(ProductLinkContext);
  return (
    <section id="buy" className="py-32 bg-[#C5D600] relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonal-stripes" width="40" height="40" patternTransform="rotate(45)">
              <rect width="20" height="40" fill="#000000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-stripes)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-none">
              Prêt à révolutionner<br/>votre style ?
            </h2>
            <p className="text-2xl text-slate-800 font-medium mb-10 max-w-xl mx-auto lg:mx-0">
              Rejoignez des millions d'hommes. Essayez le Philips OneBlade 360 aujourd'hui avec 45 jours d'essai sans risque.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
              {/* Price Tag */}
              <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-3xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                9 400 DA
              </div>
              
              <Link to={productUrl} className="group px-10 py-5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all flex items-center justify-center gap-4 text-xl font-bold shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
                Commander maintenant 
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8 mt-10">
              <div className="flex items-center gap-2 text-slate-800 font-bold bg-white/40 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Truck className="w-5 h-5 text-slate-900" /> Livraison 58 Wilayas
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-bold bg-white/40 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Banknote className="w-5 h-5 text-slate-900" /> Paiement à la livraison
              </div>
            </div>
          </div>
          
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-900/10 mix-blend-multiply transform rotate-2 hover:rotate-0 transition-transform duration-500 hidden sm:block">
            <img src="/images/packaging.jpg" alt="Philips OneBlade 360 Emballage" className="w-full h-auto object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-white/5 pb-32 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 items-center border-b border-white/10 pb-8 mb-8">
          <div>
             <span className="text-2xl font-bold tracking-tighter text-white">
              One<span className="text-[#C5D600]">Blade</span>
            </span>
            <p className="mt-4 text-sm max-w-xs">
              L'outil hybride révolutionnaire capable de tailler, délimiter et raser toutes les longueurs de poils.
            </p>
          </div>
          <div className="flex justify-center gap-6">
             <Link to="/" className="hover:text-white transition-colors">Boutique</Link>
             <a href="#accessories" className="hover:text-white transition-colors">Accessoires</a>
             <a href="#features" className="hover:text-white transition-colors">Support</a>
             <a href="#" className="hover:text-white transition-colors">Avis</a>
          </div>
          <div className="flex justify-end">
             {/* Social mockups */}
             <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-[#C5D600] transition-colors cursor-pointer" />
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-[#C5D600] transition-colors cursor-pointer" />
               <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-[#C5D600] transition-colors cursor-pointer" />
             </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} ZORANDO. Tous droits réservés.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
             <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function OneBladeLandingPage() {
  const [productUrl, setProductUrl] = useState('/product/philips-oneblade-360-qp2824');

  useEffect(() => {
    // Fetch product settings for the button
    fetch('/api/settings')
      .then(res => res.json())
      .then(settings => {
        const slug = settings.oneblade_product_slug;
        if (slug) {
          setProductUrl(`/product/${slug}`);
        }
      })
      .catch(console.error);
  }, []);

  // Pass productUrl somehow? Wait, it's better to pass it through a React Context, or just wrap the whole thing to provide the URL.
  // Actually, I can just create a Context.

  return (
    <ProductLinkContext.Provider value={productUrl}>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#C5D600] selection:text-slate-900 w-full overflow-hidden max-w-[100vw]">
         <Navbar />
         <main>
           <Hero />
           <FeatureGrid />
           <InnovativeBladeSection />
           <BodyGroomingSection />
           <InTheBox />
           <CallToAction />
         </main>
         <Footer />
      </div>
    </ProductLinkContext.Provider>
  );
}