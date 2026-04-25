import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchWishlist = async () => {
      try {
        const { data: wishlistItems, error } = await supabase
          .from('wishlists')
          .select('*')
          .eq('profile_id', user.id);

        if (error) throw error;

        // Fetch product details for each wishlist item
        if (wishlistItems && wishlistItems.length > 0) {
          const ids = wishlistItems.map((item: any) => item.product_id).join(',');
          const response = await fetch(`/api/products?ids=${ids}`);
          const products = await response.json();
          
          const mergedItems = wishlistItems.map((wish: any) => {
            const product = products.find((p: any) => p.id.toString() === wish.product_id.toString());
            return { ...wish, wishlistId: wish.id, product };
          }).filter((item: any) => item.product); // Filter out any products that might have been deleted

          setItems(mergedItems);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const handleRemove = async (wishlistId: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);
      if (error) throw error;
      setItems(items.filter(item => item.wishlistId !== wishlistId));
      toast.success('Retiré de vos favoris');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ma Liste d'envies</h2>
          <p className="text-gray-500 text-sm">Retrouvez les articles que vous avez aimés.</p>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-full">
          <span className="text-orange-700 font-bold text-sm">{items.length} articles</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-2xl"></div>)
        ) : items.length > 0 ? (
          items.map((item) => (
            <div key={item.wishlistId} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all relative">
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                <img 
                  src={item.product.image} 
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <button 
                  onClick={() => handleRemove(item.wishlistId)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">{item.product.brand_name || 'Zorando'}</p>
                <h4 className="font-bold text-sm text-gray-900 line-clamp-2 min-h-[40px] mb-2">{item.product.name}</h4>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-lg font-black text-orange-600">{formatPrice(item.product.promo_price || item.product.price)}</p>
                  <Link 
                    to={`/product/${item.product.slug}`}
                    className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white w-20 h-20 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Votre liste est vide</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">Ajoutez des articles qui vous plaisent pour les retrouver plus tard.</p>
            <Link to="/" className="mt-8 inline-flex items-center px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg">
              Parcourir les produits
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
