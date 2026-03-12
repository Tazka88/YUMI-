import { create } from 'zustand';

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
  features?: { key: string; value: string }[];
  key_points?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product, quantity) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity }] };
    });
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== productId),
    }));
  },
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === productId ? { ...i, quantity } : i
      ),
    }));
  },
  clearCart: () => set({ items: [] }),
  total: () => {
    return get().items.reduce((sum, item) => {
      const price = item.promo_price || item.price;
      return sum + price * item.quantity;
    }, 0);
  },
}));
