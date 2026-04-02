import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  promo_price: number | null;
  image: string;
  stock: number;
  is_fast_delivery?: boolean;
  reviews_count?: number;
  avg_rating?: number;
}

export const ProductCard: React.FC<{ product: Product; priority?: boolean }> = ({ product, priority = false }) => {
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const isPromo = product.promo_price !== null;
  const discount = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const avgRating = product.avg_rating ? Number(product.avg_rating) : 0;
  const reviewsCount = product.reviews_count ? Number(product.reviews_count) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full relative">
      <Link to={`/product/${product.slug}`} className="relative block h-36 sm:h-48 overflow-hidden">
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isPromo && (
            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
          {product.is_fast_delivery && (
            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              LIVRAISON RAPIDE
            </div>
          )}
        </div>
        
        <img 
          src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=400`} 
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width="400"
          height="400"
          className={`w-full h-full object-contain p-4 bg-white group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          referrerPolicy="no-referrer"
        />

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
            <span className="bg-gray-800 text-white text-sm font-bold px-3 py-1 rounded">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.slug}`} className="text-xs sm:text-sm text-gray-800 hover:text-orange-500 line-clamp-2 mb-1 sm:mb-2 flex-grow font-medium">
          {product.name}
        </Link>
        <div className="flex items-center mb-1 sm:mb-2">
          <div className="flex text-orange-400 text-[10px] sm:text-xs">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} fill={star <= Math.round(avgRating) ? "currentColor" : "none"} size={12} className="sm:w-3.5 sm:h-3.5" />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 ml-1">({reviewsCount})</span>
        </div>
        <div className="flex flex-col mt-auto mb-2 sm:mb-3">
          {isPromo ? (
            <>
              <div className="flex items-end gap-1.5 sm:gap-2">
                <div className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.promo_price!)}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 line-through mb-0.5 sm:mb-1">{formatPrice(product.price)}</div>
              </div>
              <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5 sm:mt-1">
                Vous économisez {discount}%
              </div>
            </>
          ) : (
            <div className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.price)}</div>
          )}
        </div>

        {!isOutOfStock && (
          <div className="flex flex-col gap-1.5 sm:gap-2 mt-auto">
            <button 
              onClick={(e) => {
                e.preventDefault();
                navigate('/checkout', { state: { directBuyItem: { ...product, quantity: 1 } } });
              }}
              className="w-full bg-orange-500 text-white py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-bold shadow-sm hover:bg-orange-600 transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              Acheter
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product as any, 1);
              }}
              className="w-full bg-white border border-orange-500 text-orange-600 hover:bg-orange-50 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Ajouter au panier</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
