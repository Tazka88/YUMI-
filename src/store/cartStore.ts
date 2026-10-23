import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProductEffectivePrice } from '../utils/formatPrice';

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  subcategory_id: number | null;
  subcategory_name?: string;
  subcategory_slug?: string;
  sub_subcategory_id?: number | null;
  sub_subcategory_name?: string;
  sub_subcategory_slug?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  promo_price: number | null;
  promo_price_start_date?: string | null;
  promo_price_end_date?: string | null;
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

export interface CustomerCartInfo {
  name?: string;
  phone?: string;
  email?: string;
  wilaya?: string;
  commune?: string;
}

export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('zorando_cart_session_id');
  if (!id) {
    id = 'cart_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('zorando_cart_session_id', id);
  }
  return id;
}

let syncTimer: any = null;
let lastKnownCustomerInfo: CustomerCartInfo = {};

export function triggerCartSync(items: CartItem[], customerInfo?: CustomerCartInfo) {
  if (typeof window === 'undefined') return;
  if (customerInfo) {
    lastKnownCustomerInfo = { ...lastKnownCustomerInfo, ...customerInfo };
  }

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const sessionId = getOrCreateCartSessionId();
      if (!sessionId) return;

      // Detect logged in user id if available
      let userId: string | null = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
          try {
            const val = JSON.parse(localStorage.getItem(key) || '{}');
            if (val && val.user && val.user.id) {
              userId = val.user.id;
              break;
            }
          } catch(e) {}
        }
      }

      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            price: item.price,
            promo_price: item.promo_price,
            quantity: item.quantity,
            image: item.image,
            selectedVariation: item.selectedVariation,
            cartItemId: item.cartItemId
          })),
          customer_name: lastKnownCustomerInfo.name || null,
          customer_phone: lastKnownCustomerInfo.phone || null,
          customer_email: lastKnownCustomerInfo.email || null,
          wilaya: lastKnownCustomerInfo.wilaya || null,
          commune: lastKnownCustomerInfo.commune || null,
        }),
      });
    } catch (e) {
      // Silently ignore background network errors
    }
  }, 1200);
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedVariation?: any) => void;
  removeItem: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  syncCustomerInfo: (info: CustomerCartInfo) => void;
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
            
          const existingItem = state.items.find((i) => i.cartItemId === cartItemId || i.id.toString() === cartItemId);
          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map((i) =>
              (i.cartItemId === cartItemId || i.id.toString() === cartItemId) ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            newItems = [...state.items, { ...product, cartItemId, quantity, selectedVariation }];
          }
          triggerCartSync(newItems);
          return { items: newItems };
        });
      },
      removeItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.cartItemId !== id && i.id.toString() !== id.toString());
          triggerCartSync(newItems);
          return { items: newItems };
        });
      },
      updateQuantity: (id, quantity) => {
        set((state) => {
          const newItems = state.items.map((i) =>
            (i.cartItemId === id || i.id.toString() === id.toString()) ? { ...i, quantity } : i
          );
          triggerCartSync(newItems);
          return { items: newItems };
        });
      },
      clearCart: () => {
        set(() => {
          triggerCartSync([]);
          return { items: [] };
        });
      },
      restoreCart: (items) => {
        set(() => {
          triggerCartSync(items);
          return { items };
        });
      },
      syncCustomerInfo: (info) => {
        triggerCartSync(get().items, info);
      },
      total: () => {
        return get().items.reduce((sum, item) => {
          const price = getProductEffectivePrice(item);
          return sum + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'zorando-cart-storage',
    }
  )
);
