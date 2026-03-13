import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Product[]>([]);
  const addItem = useCartStore(state => state.addItem);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/slides').then(res => res.json()).then(setSlides);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/brands').then(res => res.json()).then(data => setBrands(data.slice(0, 6)));
    fetch('/api/products?popular=true').then(res => res.json()).then(setPopularProducts);
    fetch('/api/products?best_seller=true').then(res => res.json()).then(setBestSellers);
    fetch('/api/products?new=true').then(res => res.json()).then(setNewProducts);
    fetch('/api/products').then(res => res.json()).then(data => {
      setPromotions(data.filter((p: Product) => p.promo_price !== null));
    });
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const diff = midnight.getTime() - now.getTime();
        
        if (diff > 0) {
          setTimeLeft({
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
          });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }, []);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
      <div className="flex items-center gap-1 text-sm ml-4">
        <span className="text-gray-600 mr-1 hidden sm:inline font-medium">Se termine dans :</span>
        <div className="bg-red-500 text-white font-bold px-2 py-1 rounded">{formatNumber(timeLeft.hours)}</div>
        <span className="text-red-500 font-bold">:</span>
        <div className="bg-red-500 text-white font-bold px-2 py-1 rounded">{formatNumber(timeLeft.minutes)}</div>
        <span className="text-red-500 font-bold">:</span>
        <div className="bg-red-500 text-white font-bold px-2 py-1 rounded">{formatNumber(timeLeft.seconds)}</div>
      </div>
    );
  };

  const SectionHeader = ({ title, link, children }: { title: string, link?: string, children?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-4 mt-8 bg-white p-3 rounded-t-lg border-b-2 border-orange-500">
      <div className="flex items-center">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {children}
      </div>
      {link && (
        <Link to={link} className="text-sm text-orange-500 hover:underline flex items-center">
          Voir tout <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Banner Carousel */}
      <div className="mb-8 rounded-xl overflow-hidden shadow-md relative h-[200px] md:h-[400px] group">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="text-white p-8 max-w-lg">
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{slide.title}</h1>
                <p className="text-lg mb-6 hidden md:block">{slide.description}</p>
                <Link to={slide.link || '#'} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-md inline-block transition-colors shadow-lg">
                  {slide.button_text || 'Découvrir'}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-orange-500' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Catégories Populaires</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.slice(0, 12).map(cat => (
            <Link key={cat.id} to={`/category/${cat.slug}`} className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden mb-2 border-2 border-transparent group-hover:border-orange-500 transition-colors">
                <img 
                  src={cat.image || `https://picsum.photos/seed/${cat.slug}/200/200`} 
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs md:text-sm text-center text-gray-700 group-hover:text-orange-500 font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Brands Section */}
      {brands.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Nos Marques</h2>
            <Link to="/brands" className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1">
              Voir tout <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {brands.map(brand => (
              <Link 
                key={brand.id} 
                to={`/brands/${brand.slug}`} 
                className="relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 group bg-white block"
              >
                {brand.image ? (
                  <img 
                    src={brand.image} 
                    alt={brand.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-500">
                    <span className="font-bold text-4xl">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                  <span className="text-white font-bold text-sm text-center px-2">{brand.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <section>
          <SectionHeader title="Ventes Flash ⚡" link="/category/all">
            <CountdownTimer />
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {promotions.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section>
          <SectionHeader title="Meilleures Ventes 🏆" link="/category/all" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bestSellers.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <section>
          <SectionHeader title="Produits Populaires 🔥" link="/category/all" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popularProducts.slice(0, 10).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <section>
          <SectionHeader title="Nouveautés 🆕" link="/category/all" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {newProducts.slice(0, 5).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
