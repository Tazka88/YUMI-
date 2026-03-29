import React from 'react';
import { Link } from 'react-router-dom';
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
  const isPromo = product.promo_price !== null;
  const discount = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const avgRating = product.avg_rating ? Number(product.avg_rating) : 0;
  const reviewsCount = product.reviews_count ? Number(product.reviews_count) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full relative">
      <Link to={`/product/${product.slug}`} className="relative block h-48 overflow-hidden">
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

        {/* Hover Add to Cart Button */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-2 md:p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 z-20 flex justify-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                addItem(product as any, 1);
              }}
              className="w-full bg-orange-500/95 backdrop-blur-sm md:bg-orange-500 text-white py-2 md:py-2 rounded-md text-sm md:text-base font-medium shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Ajouter au panier</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.slug}`} className="text-sm text-gray-800 hover:text-orange-500 line-clamp-2 mb-2 flex-grow font-medium">
          {product.name}
        </Link>
        <div className="flex items-center mb-2">
          <div className="flex text-orange-400 text-xs">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} fill={star <= Math.round(avgRating) ? "currentColor" : "none"} size={14} />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({reviewsCount})</span>
        </div>
        <div className="flex flex-col mt-auto">
          {isPromo ? (
            <>
              <div className="flex items-end gap-2">
                <div className="text-lg font-bold text-gray-900">{formatPrice(product.promo_price!)}</div>
                <div className="text-xs text-gray-500 line-through mb-1">{formatPrice(product.price)}</div>
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">
                Vous économisez {discount}%
              </div>
            </>
          ) : (
            <div className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</div>
          )}
        </div>
      </div>
    </div>
  );
};
