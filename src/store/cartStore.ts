import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: number;
  category_id: number;
  subcategory_id: number | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  promo_price: number | null;
  stock: number;
  image: string;
  is_popular: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  is_recommended: boolean;
  is_fast_delivery?: boolean;
  is_active?: boolean;
  sku?: string;
  features?: string | { key: string; value: string }[];
  key_points?: string[];
  reviews_count?: number;
  avg_rating?: number;
  variations?: any;
}

export interface CartItem extends Product {
  cartItemId?: string;
  quantity: number;
  selectedVariation?: any;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedVariation?: any) => void;
  removeItem: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity, selectedVariation) => {
        set((state) => {
          const cartItemId = selectedVariation 
            ? `${product.id}-${selectedVariation.id}` 
            : `${product.id}`;
            
          const existingItem = state.items.find((i) => i.cartItemId === cartItemId || i.id === cartItemId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                (i.cartItemId === cartItemId || i.id === cartItemId) ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, cartItemId, quantity, selectedVariation }] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== id && i.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            (i.cartItemId === id || i.id === id) ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () => {
        return get().items.reduce((sum, item) => {
          const price = item.selectedVariation?.price || item.promo_price || item.price;
          return sum + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'zorando-cart-storage', // name of the item in the storage (must be unique)
    }
  )
);
