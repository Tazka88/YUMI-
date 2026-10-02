import React, { useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { user } = useAuth();
  const { items, isLoading, fetchWishlist, removeFromWishlist, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (user) {
      fetchWishlist(user);
    }
  }, [user]);

  const handleAddToCart = (item: any) => {
    addItem(
      {
        id: item.product_id || item.id,
        name: item.name,
        price: item.price,
        promo_price: item.promo_price,
        image: item.image,
        stock: item.stock !== undefined ? item.stock : 10,
        slug: item.slug
      } as any,
      1
    );
    toast.success(`${item.name} ajouté au panier ! 🛒`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 text-red-500">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Ma Liste d'envies</h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Sauvegardez vos articles préférés pour les commander en 1 clic quand vous voulez.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="bg-orange-50 text-orange-700 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-orange-200">
              {items.length} {items.length > 1 ? 'articles favoris' : 'article favori'}
            </span>
            <button
              type="button"
              onClick={clearWishlist}
              className="text-xs text-gray-400 hover:text-red-600 font-semibold transition-colors"
            >
              Tout vider
            </button>
          </div>
        )}
      </div>

      {/* Guide Banner for the client */}
      <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/30 border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Astuce pour vos favoris
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Cliquez simplement sur l'icône <strong>cœur ❤️</strong> en haut à droite de n'importe quel article dans la boutique pour l'ajouter instantanément ici.
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0"
        >
          <span>Parcourir la boutique</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && items.length === 0 ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-gray-50 animate-pulse rounded-2xl border border-gray-100"
            />
          ))
        ) : items.length > 0 ? (
          items.map((item) => {
            const currentPrice = item.promo_price || item.price;
            const hasPromo = item.promo_price && item.promo_price < item.price;

            return (
              <div
                key={item.product_id || item.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                  <Link to={`/product/${item.slug}`} className="block w-full h-full">
                    <img
                      src={
                        item.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=300`
                      }
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Promo Badge */}
                  {hasPromo && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
                      PROMO
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.product_id || item.id, user)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-500 text-gray-500 hover:text-white rounded-full shadow-sm transition-all duration-200"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {item.brand_name || 'Zorando'}
                  </span>

                  <Link
                    to={`/product/${item.slug}`}
                    className="font-bold text-sm text-gray-900 hover:text-orange-600 transition-colors line-clamp-2 min-h-[40px] mb-3"
                  >
                    {item.name}
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4 mt-auto">
                    <span className="text-lg font-black text-gray-900">
                      {formatPrice(currentPrice)}
                    </span>
                    {hasPromo && (
                      <span className="text-xs text-gray-400 line-through font-semibold">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>

                    <Link
                      to={`/product/${item.slug}`}
                      className="py-2.5 px-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <span>Voir</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State with detailed guidance */
          <div className="col-span-full text-center py-16 px-6 bg-gray-50/70 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Heart className="w-8 h-8 fill-red-100 text-red-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Votre liste d'envies est vide</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              Vous n'avez pas encore ajouté d'articles à vos favoris.
            </p>

            <div className="mt-6 max-w-sm mx-auto bg-white p-4 rounded-2xl border border-gray-100 text-left shadow-sm">
              <span className="text-xs font-bold text-gray-900 block mb-2">
                💡 Comment ajouter vos coups de cœur :
              </span>
              <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                <li>Parcourez les produits de la boutique</li>
                <li>Cliquez sur l'icône <strong>cœur ❤️</strong> en haut à droite des articles</li>
                <li>Retrouvez-les ici à tout moment pour commander facilement</li>
              </ul>
            </div>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95"
            >
              <span>Découvrir nos produits</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
