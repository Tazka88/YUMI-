import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product, ProductVariation } from '../types';

interface CartContextType {
  items: CartItem[];
  itemsCount: number;
  subtotal: number;
  isFreeShipping: boolean;
  freeShippingProgress: { current: number; target: number; percentage: number };
  addToCart: (product: Product, selectedVariation?: ProductVariation | null, quantity?: number) => boolean;
  removeFromCart: (productId: number | string, variation?: string | null) => void;
  updateQuantity: (productId: number | string, variation: string | null, quantity: number) => void;
  clearCart: () => void;
  calculateDelivery: (baseFee: number, isStopDesk: boolean) => number;
}

const STORAGE_KEY = '@zorando_cart_v1';

const CartContext = createContext<CartContextType>({
  items: [],
  itemsCount: 0,
  subtotal: 0,
  isFreeShipping: false,
  freeShippingProgress: { current: 0, target: 10000, percentage: 0 },
  addToCart: () => false,
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  calculateDelivery: () => 600,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le panier depuis AsyncStorage au démarrage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch (e) {
            console.warn('Failed to parse cart storage:', e);
          }
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Sauvegarder à chaque modification
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((err) =>
        console.warn('Failed to save cart:', err)
      );
    }
  }, [items, isLoaded]);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Règle de livraison gratuite de ZORANDO.com : Sous-total >= 10 000 DZD ET au moins 3 articles
  const isFreeShipping = subtotal >= 10000 && itemsCount >= 3;
  const freeShippingProgress = {
    current: subtotal,
    target: 10000,
    percentage: Math.min(100, Math.round((subtotal / 10000) * 100)),
  };

  const addToCart = (
    product: Product,
    selectedVariation?: ProductVariation | null,
    quantity: number = 1
  ): boolean => {
    // Calculer le prix effectif
    let effectivePrice = product.promo_price || product.price;
    let maxStock = product.stock;
    let variationStr: string | null = null;

    if (selectedVariation) {
      variationStr = `${selectedVariation.attribute} : ${selectedVariation.value}`;
      if (selectedVariation.price) effectivePrice = Number(selectedVariation.price);
      if (selectedVariation.stock !== undefined) maxStock = Number(selectedVariation.stock);
    }

    if (maxStock <= 0) return false;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product_id === product.id && i.variation === variationStr
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, maxStock);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: effectivePrice,
            original_price: product.price,
            quantity: Math.min(quantity, maxStock),
            image: product.image,
            variation: variationStr,
            max_stock: maxStock,
          },
        ];
      }
    });

    return true;
  };

  const removeFromCart = (productId: number | string, variation?: string | null) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.product_id === productId && (i.variation || null) === (variation || null))
      )
    );
  };

  const updateQuantity = (
    productId: number | string,
    variation: string | null,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variation);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId && (item.variation || null) === (variation || null)) {
          return {
            ...item,
            quantity: Math.min(quantity, item.max_stock),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const calculateDelivery = (baseFee: number, isStopDesk: boolean): number => {
    if (isFreeShipping) return 0;
    // Si stop desk, appliquer réduction ou tarif standard
    return Math.max(0, baseFee);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemsCount,
        subtotal,
        isFreeShipping,
        freeShippingProgress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        calculateDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
