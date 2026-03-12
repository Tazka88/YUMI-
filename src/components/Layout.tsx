import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User, MessageCircle, X, Phone, LayoutDashboard } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import React, { useState, useEffect } from 'react';

export default function Layout() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
      
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-black text-white text-xs py-2 relative z-50">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <a href={`tel:${settings.announcement_phone?.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-orange-400 transition-colors whitespace-nowrap">
              <Phone size={12} />
              {settings.announcement_phone || '+213 555 00 00 00'}
            </a>
            <div className="text-center flex-1 px-4">
              {settings.announcement_text || '🚚 Livraison gratuite à partir de 5 000 DA | Paiement à la livraison partout en Algérie'}
            </div>
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 text-gray-400 hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-orange-500 text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Toggle & Logo */}
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden p-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <span className="bg-white text-orange-500 px-2 py-1 rounded-md font-black italic">Y</span>
                Yumi
              </Link>
            </div>

            {/* Search Bar (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
              <input
                type="text"
                placeholder="Chercher un produit, une marque ou une catégorie..."
                className="w-full py-2 pl-4 pr-10 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-orange-500">
                <Search size={20} />
              </button>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <Link to="/admin/login" className="hidden md:flex flex-col items-center hover:text-orange-100">
                <User size={24} />
                <span className="text-xs mt-1">Se connecter</span>
              </Link>
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
          <form onSubmit={handleSearch} className="mt-3 md:hidden relative">
            <input
              type="text"
              placeholder="Chercher un produit..."
              className="w-full py-2 pl-4 pr-10 rounded-md bg-white text-gray-900 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-0 top-0 h-full px-3 text-gray-500">
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Categories Nav (Desktop) */}
        <nav className="hidden md:block bg-orange-600">
          <div className="container mx-auto px-4 relative flex items-center">
            <ul className="flex items-center space-x-6 py-2 text-sm font-medium flex-wrap">
              {categories.map(cat => (
                <li key={cat.id} className="group relative">
                  <Link to={`/category/${cat.slug}`} className="hover:text-black transition-colors py-2 block whitespace-nowrap">
                    {cat.name}
                  </Link>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="absolute left-0 top-full mt-0 hidden group-hover:block bg-white text-gray-800 shadow-lg rounded-b-md border border-gray-100 min-w-[200px] z-50">
                      <ul className="py-2">
                        {cat.subcategories.map((sub: any) => (
                          <li key={sub.id}>
                            <Link 
                              to={`/category/${sub.slug}?sub=true`} 
                              className="block px-4 py-2 hover:bg-orange-50 hover:text-orange-500 transition-colors whitespace-normal"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-64 h-full overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Catégories</h3>
            <ul className="space-y-4">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className="block font-bold text-gray-800 hover:text-orange-500 mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="pl-4 space-y-2 border-l-2 border-gray-100">
                      {cat.subcategories.map((sub: any) => (
                        <li key={sub.id}>
                          <Link 
                            to={`/category/${sub.slug}?sub=true`} 
                            className="block text-sm text-gray-600 hover:text-orange-500"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
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
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="bg-orange-500 text-white px-2 py-1 rounded-md font-black italic">Y</span>
              Yumi
            </div>
            <p className="text-sm">
              Votre boutique en ligne de confiance en Algérie. Les meilleurs produits aux meilleurs prix, avec paiement à la livraison.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Liens utiles</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-orange-500">Accueil</Link></li>
              <li><Link to="/cart" className="hover:text-orange-500">Panier</Link></li>
              <li><Link to="/admin/login" className="hover:text-orange-500">Espace Vendeur</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: contact@yumi.dz</li>
              <li>Tél: +213 555 00 00 00</li>
              <li>Alger, Algérie</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-4 border-t border-gray-800 text-center text-sm">
          &copy; {new Date().getFullYear()} Yumi Algérie. Tous droits réservés.
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/213555000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 flex items-center justify-center"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
