import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User, MessageCircle, X, Phone, LayoutDashboard, Facebook, Instagram, Youtube, Truck, MapPin, ChevronRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../lib/AuthContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWithCache } from '../lib/utils';
import TopBar from './TopBar';

const categoryEmojis: Record<string, string> = {
  "Mode & Vêtements": "👗",
  "Beauté & Santé": "💄",
  "Électroménager": "🔌",
  "Informatique": "💻",
  "Sports & Loisirs": "⚽",
  "Bébé & Jouets": "🧸",
  "Téléphone & Tablette": "📱",
  "Accessoire Auto Moto": "🚗",
  "Jouets et Jeux": "🎲",
  "Maison, cuisine & bureau": "🏠"
};

export const getCategoryWithEmoji = (name: string) => {
  // Check if the name already starts with an emoji to avoid duplication
  if (!name) return name;
  const emoji = categoryEmojis[name];
  if (emoji && !name.startsWith(emoji)) {
    return `${emoji} ${name}`;
  }
  return name;
};

export const CategoryNameDisplay = ({ name, className = "" }: { name: string, className?: string }) => {
  if (!name) return null;
  const emoji = categoryEmojis[name];
  
  // If the name already has the emoji at the start, we can try to split it for alignment
  if (emoji && name.startsWith(emoji)) {
    const textWithoutEmoji = name.substring(emoji.length).trim();
    return (
      <span className={`flex items-start gap-2 ${className}`}>
        <span className="shrink-0">{emoji}</span>
        <span>{textWithoutEmoji}</span>
      </span>
    );
  }
  
  // If it doesn't have the emoji but should
  if (emoji) {
    return (
      <span className={`flex items-start gap-2 ${className}`}>
        <span className="shrink-0">{emoji}</span>
        <span>{name}</span>
      </span>
    );
  }
  
  // No emoji
  return <span className={className}>{name}</span>;
};

export default function Layout() {
  const { user, profile } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const mobileSearchRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSubcategories, setExpandedSubcategories] = useState<number[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [settings, setSettings] = useState<any>({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [footerLinks, setFooterLinks] = useState<any[]>([]);

  const toggleSubcategory = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubcategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const handleFetchError = (err: any) => {
      if (err.name !== 'AbortError') console.error(err);
    };

    fetchWithCache('/api/categories', { signal, priority: 'high' } as any)
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(handleFetchError);
      
      fetchWithCache('/api/settings', { signal, priority: 'high' } as any)
        .then(data => {
          if (data && typeof data === 'object' && !(data as any).error) setSettings(data);
          setIsSettingsLoaded(true);
        })
      .catch((err) => {
        handleFetchError(err);
        setIsSettingsLoaded(true);
      });

    fetchWithCache('/api/footer-links', { signal })
      .then(data => {
        if (Array.isArray(data)) setFooterLinks(data);
      })
      .catch(handleFetchError);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (searchQuery.trim().length > 0) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data.slice(0, 5));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') console.error("Error fetching suggestions:", error);
        }
      };
      
      const timeoutId = setTimeout(fetchSuggestions, 300);
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/category/all?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <TopBar />

      {/* Header */}
      <header className="bg-orange-500 text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Toggle & Logo */}
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="flex items-center hover:opacity-90 transition-opacity" aria-label="ZORANDO Accueil">
                <svg width="190" height="36" viewBox="0 0 190 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 md:h-9 w-auto">
                  <g transform="translate(2, 2)">
                    <path d="M10 10V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    <rect x="2" y="10" width="24" height="20" rx="4" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                    <path d="M9 14.5 H19 L9 24.5 H19" stroke="#FFD8A8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M26 4L27 1L28 4L31 5L28 6L27 9L26 6L23 5L26 4Z" fill="#FFD8A8"/>
                  </g>
                  <text x="38" y="28" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="28" fontWeight="900" fill="white" letterSpacing="-0.02em"><tspan fill="black" fontSize="36">Z</tspan>ORANDO</text>
                </svg>
              </Link>
            </div>

            {/* Search Bar (Desktop) */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative">
              <form onSubmit={handleSearch} className="w-full relative">
                <input
                  type="text"
                  placeholder="Chercher un produit, une marque ou une catégorie..."
                  className="w-full py-2 pl-4 pr-10 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim().length > 0) setShowSuggestions(true); }}
                />
                <button type="submit" className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-orange-500">
                  <Search size={20} />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden z-50">
                  <ul className="py-1">
                    {suggestions.map((product) => (
                      <li key={product.id}>
                        <Link 
                          to={`/product/${product.slug}`}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors cursor-pointer"
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Search size={14} className="text-gray-400" />
                            <span className="truncate">{product.name}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-4 mr-2">
                {user ? (
                  <Link to="/account/dashboard" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors border border-white/20">
                    <User size={20} />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] text-orange-200">Bonjour,</span>
                      <span className="text-xs font-bold truncate max-w-[80px]">{profile?.firstName || user.displayName?.split(' ')[0] || 'Compte'}</span>
                    </div>
                  </Link>
                ) : (
                  <Link to="/account/login" className="flex items-center gap-2 hover:text-orange-100 transition-colors">
                    <User size={24} />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] text-orange-200">Se connecter</span>
                      <span className="text-xs font-bold">Votre Compte</span>
                    </div>
                  </Link>
                )}
              </div>

              <Link to="/cart" className="flex flex-col items-center hover:text-orange-100 relative">
                <div className="relative">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 hidden md:block">Panier</span>
              </Link>
            </div>
          </div>

          {/* Search Bar (Mobile) */}
          <div ref={mobileSearchRef} className="mt-3 md:hidden relative">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Chercher un produit..."
                className="w-full py-2 pl-4 pr-10 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim().length > 0) setShowSuggestions(true); }}
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-3 text-gray-500">
                <Search size={20} />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden z-50">
                <ul className="py-1">
                  {suggestions.map((product) => (
                    <li key={product.id}>
                      <Link 
                        to={`/product/${product.slug}`}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors cursor-pointer"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Search size={14} className="text-gray-400" />
                          <span className="truncate">{product.name}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Categories Nav (Desktop) Removed */}
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-64 h-full overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-lg text-gray-900">Catégories</h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            
            {user && (
              <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-orange-200">
                    <User className="text-orange-500" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{profile?.firstName || user.displayName || 'Client'}</h4>
                    <Link to="/account/dashboard" onClick={() => setIsMenuOpen(false)} className="text-xs text-orange-600 font-bold hover:underline">Accéder à mon espace</Link>
                  </div>
                </div>
              </div>
            )}

            {!user && (
              <div className="mb-6 grid grid-cols-2 gap-2">
                <Link to="/account/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg truncate">Connexion</Link>
                <Link to="/account/register" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-2 border border-orange-600 text-orange-600 text-xs font-bold rounded-lg truncate">Inscription</Link>
              </div>
            )}

            <ul className="space-y-4">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className="block font-bold text-[15px] text-gray-800 hover:text-orange-500 mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CategoryNameDisplay name={cat.name} />
                  </Link>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="pl-4 space-y-2 border-l-2 border-gray-100">
                      {cat.subcategories.map((sub: any) => (
                        <li key={sub.id}>
                          <div className="flex items-center justify-between">
                            <Link 
                              to={`/category/${sub.slug}?sub=true`} 
                              className="block font-semibold text-[14px] text-gray-700 hover:text-orange-500 py-1 flex-1"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <CategoryNameDisplay name={sub.name} />
                            </Link>
                            {sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                              <button 
                                onClick={(e) => toggleSubcategory(sub.id, e)}
                                className="p-2 text-gray-400 hover:text-orange-500"
                              >
                                <ChevronRight size={16} className={`transition-transform duration-200 ${expandedSubcategories.includes(sub.id) ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>
                          {sub.sub_subcategories && sub.sub_subcategories.length > 0 && expandedSubcategories.includes(sub.id) && (
                            <ul className="pl-4 mt-1 space-y-2 border-l-2 border-gray-100">
                              {sub.sub_subcategories.map((subsub: any) => (
                                <li key={subsub.id}>
                                  <Link 
                                    to={`/category/${subsub.slug}?subsub=true`} 
                                    className="block font-normal text-[13px] font-sans text-gray-500 hover:text-orange-500 py-1"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    <CategoryNameDisplay name={subsub.name} />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1 */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Besoin d'aide ?</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.filter(l => l.column_id === 1).map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">{link.name}</a>
                  ) : (
                    <Link to={link.url} className="hover:text-orange-500 transition-colors">{link.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">À propos</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.filter(l => l.column_id === 2).map(link => (
                <li key={link.id}>
                  {link.url.startsWith('http') ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">{link.name}</a>
                  ) : (
                    <Link to={link.url} className="hover:text-orange-500 transition-colors">{link.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Modes de paiement et livraison</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="bg-orange-500/20 p-2 rounded-full text-orange-500">
                  <Truck size={20} />
                </div>
                <span className="text-sm font-medium text-white">Paiement à la livraison uniquement</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="bg-orange-500/20 p-2 rounded-full text-orange-500">
                  <MapPin size={20} />
                </div>
                <span className="text-sm font-medium text-white">Livraison sur 58 wilayas</span>
              </div>
            </div>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Retrouvez-nous sur</h4>
            <div className="flex items-center gap-4">
              {settings.social_facebook_visible === '1' && settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#1877F2] hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {settings.social_instagram_visible === '1' && settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#E4405F] hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {settings.social_tiktok_visible === '1' && settings.social_tiktok && (
                <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-black hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
              )}
              {settings.social_youtube_visible === '1' && settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#FF0000] hover:text-white transition-colors">
                  <Youtube size={20} />
                </a>
              )}
            </div>
            
            <div className="mt-6">
              <h4 className="text-white font-bold mb-3 uppercase text-sm tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {settings.contact_email && <li>{settings.contact_email}</li>}
                {settings.contact_phone && <li>{settings.contact_phone}</li>}
                {settings.contact_address && <li>{settings.contact_address}</li>}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          {settings.copyright_text || `© ${new Date().getFullYear()} ZORANDO Algérie. Tous droits réservés.`}
        </div>
      </footer>
    </div>
  );
}
