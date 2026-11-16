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
  sub_sub_subcategory_id?: number | null;
  sub_sub_subcategory_name?: string;
  sub_sub_subcategory_slug?: string;
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

      // DO NOT sync anonymous carts without a registered user or customer contact info
      // Ensures abandoned carts in admin only contain contactable registered customers
      if (!userId && !lastKnownCustomerInfo.phone && !lastKnownCustomerInfo.email) {
        return;
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

export interface AppliedPromo {
  code: string;
  product_id: number | null;
  product_name: string;
  product_image?: string;
  discount_percent: number;
  discount_amount?: number;
}

export interface AppliedVoucher {
  id: number;
  code: string;
  amount: number;
  minimum_order_amount: number;
  allow_promo_stacking: boolean;
  excluded_product_ids?: number[];
  expires_at?: string | null;
  reason?: string | null;
}

interface CartStore {
  items: CartItem[];
  appliedPromo: AppliedPromo | null;
  appliedVoucher: AppliedVoucher | null;
  addItem: (product: Product, quantity: number, selectedVariation?: any) => void;
  removeItem: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  syncCustomerInfo: (info: CustomerCartInfo) => void;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  getPromoDiscount: () => number;
  getVoucherEligibleSubtotal: () => number;
  getVoucherDiscount: () => number;
  total: () => number;
  finalTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromo: null,
      appliedVoucher: null,
      setAppliedPromo: (promo) => {
        set({ appliedPromo: promo });
      },
      setAppliedVoucher: (voucher) => {
        set({ appliedVoucher: voucher });
      },
      getPromoDiscount: () => {
        const { appliedPromo, items } = get();
        if (!appliedPromo || items.length === 0) return 0;

        if (!appliedPromo.product_id) {
          const cartSubtotal = get().total();
          const discount = Math.round((cartSubtotal * Number(appliedPromo.discount_percent)) / 100);
          return Math.min(discount, cartSubtotal);
        }

        const matchingItems = items.filter((i) => String(i.id) === String(appliedPromo.product_id));
        if (matchingItems.length === 0) return 0;
        const eligibleTotal = matchingItems.reduce((sum, item) => {
          const price = getProductEffectivePrice(item);
          return sum + price * item.quantity;
        }, 0);
        const discount = Math.round((eligibleTotal * Number(appliedPromo.discount_percent)) / 100);
        return Math.min(discount, eligibleTotal);
      },
      getVoucherEligibleSubtotal: () => {
        const { appliedVoucher, items } = get();
        const excludedSet = new Set((appliedVoucher?.excluded_product_ids || []).map((id) => Number(id)));
        return items.reduce((sum, item) => {
          if (excludedSet.has(Number(item.id))) return sum;
          const price = getProductEffectivePrice(item);
          return sum + price * item.quantity;
        }, 0);
      },
      getVoucherDiscount: () => {
        const { appliedVoucher, appliedPromo } = get();
        if (!appliedVoucher) return 0;
        if (appliedPromo && !appliedVoucher.allow_promo_stacking) return 0;
        const eligibleSubtotal = get().getVoucherEligibleSubtotal();
        if (eligibleSubtotal < (Number(appliedVoucher.minimum_order_amount) || 0)) return 0;
        const subtotalAfterPromo = Math.max(0, get().total() - get().getPromoDiscount());
        return Math.min(Number(appliedVoucher.amount) || 0, eligibleSubtotal, subtotalAfterPromo);
      },
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
          
          // Check if promo product was removed or cart is now empty
          let nextPromo = state.appliedPromo;
          if (newItems.length === 0) {
            nextPromo = null;
          } else if (nextPromo && nextPromo.product_id) {
            const hasPromoProduct = newItems.some((i) => String(i.id) === String(nextPromo?.product_id));
            if (!hasPromoProduct) {
              nextPromo = null;
            }
          }
          
          return {
            items: newItems,
            appliedPromo: nextPromo,
            appliedVoucher: newItems.length === 0 ? null : state.appliedVoucher,
          };
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
          return { items: [], appliedPromo: null, appliedVoucher: null };
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
      finalTotal: () => {
        const subtotal = get().total();
        const promoDiscount = get().getPromoDiscount();
        const voucherDiscount = get().getVoucherDiscount();
        return Math.max(0, subtotal - promoDiscount - voucherDiscount);
      },
    }),
    {
      name: 'zorando-cart-storage',
    }
  )
);
