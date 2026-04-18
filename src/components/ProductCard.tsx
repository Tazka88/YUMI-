import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { getResizedImageUrl } from '../lib/utils';

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
  variations?: any;
}

export const ProductCard: React.FC<{ product: Product; priority?: boolean; isFlashSale?: boolean }> = ({ product, priority = false, isFlashSale = false }) => {
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const isPromo = product.promo_price !== null;
  const discount = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const avgRating = product.avg_rating ? Number(product.avg_rating) : 0;
  const reviewsCount = product.reviews_count ? Number(product.reviews_count) : 0;
  
  let hasVariations = false;
  if (typeof product.variations === 'string' && product.variations.length > 5) {
     hasVariations = true;
  } else if (Array.isArray(product.variations) && product.variations.length > 0) {
     hasVariations = true;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full relative border border-gray-100">
      <div className="relative block h-36 sm:h-48 overflow-hidden">
        {/* Badges - Top left */}
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col gap-1 z-10">
          {isPromo && (
            <div className="bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm shadow-sm">
              -{discount}%
            </div>
          )}
          {product.is_fast_delivery && (
            <div className="bg-green-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-sm shadow-sm leading-tight">
              LIVRAISON RAPIDE
            </div>
          )}
        </div>
        
        {/* Quick Add to Cart - Top right */}
        {!isOutOfStock && !hasVariations && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product as any, 1);
            }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-orange-500 text-orange-500 hover:text-white p-2 rounded-full shadow-md z-10 transition-colors duration-200"
            title="Ajouter au panier"
          >
            <ShoppingCart size={18} />
          </button>
        )}

        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img 
            src={getResizedImageUrl(product.image, 400) || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=400`} 
            srcSet={product.image && product.image.startsWith('/api/images/') ? `${getResizedImageUrl(product.image, 200)} 200w, ${getResizedImageUrl(product.image, 400)} 400w` : undefined}
            sizes="(max-width: 640px) 200px, 400px"
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
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.slug}`} className="text-xs sm:text-sm text-gray-800 hover:text-orange-500 line-clamp-2 mb-1 sm:mb-2 flex-grow font-medium leading-snug">
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
              <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5 sm:mt-1 bg-green-50 self-start px-1.5 py-0.5 rounded">
                Vous économisez {discount}%
              </div>
            </>
          ) : (
            <div className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.price)}</div>
          )}
        </div>

        {isFlashSale && !isOutOfStock && (
          <div className="mb-2 sm:mb-3">
            <div className="text-[10px] sm:text-xs text-gray-700 mb-1 font-medium">
              {product.stock} articles restants
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div 
                className="bg-red-600 h-1.5 sm:h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, Math.min(100, (product.stock / 50) * 100))}%` }}
              ></div>
            </div>
          </div>
        )}

        {!isOutOfStock && (
          <div className="mt-auto pt-2 flex justify-center">
            {hasVariations ? (
              <Link 
                to={`/product/${product.slug}`}
                className="w-[85%] sm:w-full mx-auto bg-gray-800 text-white py-1.5 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-bold shadow hover:shadow-lg hover:bg-gray-900 transition-all duration-200 flex items-center justify-center tracking-wide"
              >
                Choisir les options
              </Link>
            ) : (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/checkout', { state: { directBuyItem: { ...product, quantity: 1 } } });
                }}
                className="w-[85%] sm:w-full mx-auto bg-orange-500 text-white py-1.5 sm:py-2.5 rounded-lg text-[11px] sm:text-sm font-bold shadow hover:shadow-lg hover:bg-orange-600 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center tracking-wide"
              >
                Acheter maintenant
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
