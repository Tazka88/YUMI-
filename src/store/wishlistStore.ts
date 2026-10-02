import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  slug: string;
  price: number;
  promo_price?: number | null;
  image: string;
  brand_name?: string;
  stock?: number;
  created_at?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: any, user?: any) => Promise<boolean>;
  addToWishlist: (product: any, user?: any) => Promise<void>;
  removeFromWishlist: (productId: number, user?: any) => Promise<void>;
  fetchWishlist: (user?: any) => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      isFavorite: (productId: number) => {
        return get().items.some(
          (item) => Number(item.product_id || item.id) === Number(productId)
        );
      },

      fetchWishlist: async (user?: any) => {
        const supabase = getSupabase();
        if (!user || !supabase) return;

        set({ isLoading: true });
        try {
          const { data: wishlistRows, error } = await supabase
            .from('wishlists')
            .select('*')
            .eq('profile_id', user.id);

          if (error) throw error;

          if (wishlistRows && wishlistRows.length > 0) {
            const productIds = wishlistRows.map((r: any) => r.product_id).join(',');
            const res = await fetch(`/api/products?ids=${productIds}&limit=100`);
            if (res.ok) {
              const products = await res.json();
              if (Array.isArray(products)) {
                const merged: WishlistItem[] = wishlistRows
                  .map((row: any) => {
                    const prod = products.find(
                      (p: any) => Number(p.id) === Number(row.product_id)
                    );
                    if (!prod) return null;
                    return {
                      id: row.id,
                      product_id: Number(prod.id),
                      name: prod.name,
                      slug: prod.slug,
                      price: Number(prod.price),
                      promo_price: prod.promo_price ? Number(prod.promo_price) : null,
                      image: prod.image,
                      brand_name: prod.brand_name || 'Zorando',
                      stock: prod.stock,
                      created_at: row.created_at
                    };
                  })
                  .filter(Boolean) as WishlistItem[];

                set({ items: merged });
              }
            }
          } else {
            // Keep local items if any or set empty
            const currentLocal = get().items;
            if (currentLocal.length === 0) {
              set({ items: [] });
            }
          }
        } catch (err) {
          console.error('Error fetching remote wishlist:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleFavorite: async (product: any, user?: any) => {
        const prodId = Number(product.id || product.product_id);
        const exists = get().isFavorite(prodId);

        if (exists) {
          await get().removeFromWishlist(prodId, user);
          return false;
        } else {
          await get().addToWishlist(product, user);
          return true;
        }
      },

      addToWishlist: async (product: any, user?: any) => {
        const prodId = Number(product.id || product.product_id);
        if (get().isFavorite(prodId)) return;

        const newItem: WishlistItem = {
          id: Date.now(),
          product_id: prodId,
          name: product.name,
          slug: product.slug || '',
          price: Number(product.price || 0),
          promo_price: product.promo_price ? Number(product.promo_price) : null,
          image: product.image || '',
          brand_name: product.brand_name || 'Zorando',
          stock: product.stock !== undefined ? Number(product.stock) : 10,
          created_at: new Date().toISOString()
        };

        set((state) => ({
          items: [newItem, ...state.items]
        }));
        toast.success('Ajouté à votre liste d\'envies ❤️', { id: `wishlist-${prodId}` });

        const supabase = getSupabase();
        if (user && supabase) {
          try {
            const { data } = await supabase
              .from('wishlists')
              .insert([{ profile_id: user.id, product_id: prodId }])
              .select('id')
              .single();

            if (data?.id) {
              set((state) => ({
                items: state.items.map((it) =>
                  it.product_id === prodId ? { ...it, id: data.id } : it
                )
              }));
            }
          } catch (e) {
            console.error('Failed to sync wishlist insert to Supabase:', e);
          }
        }
      },

      removeFromWishlist: async (productId: number, user?: any) => {
        const prodId = Number(productId);
        const existing = get().items.find(
          (it) => Number(it.product_id || it.id) === prodId
        );

        set((state) => ({
          items: state.items.filter(
            (it) => Number(it.product_id || it.id) !== prodId
          )
        }));
        toast.success('Retiré de vos favoris', { id: `wishlist-${prodId}` });

        const supabase = getSupabase();
        if (user && supabase && existing) {
          try {
            await supabase
              .from('wishlists')
              .delete()
              .eq('profile_id', user.id)
              .eq('product_id', prodId);
          } catch (e) {
            console.error('Failed to sync wishlist delete to Supabase:', e);
          }
        }
      },

      clearWishlist: () => set({ items: [] })
    }),
    {
      name: 'zorando_wishlist',
      partialize: (state) => ({ items: state.items })
    }
  )
);
