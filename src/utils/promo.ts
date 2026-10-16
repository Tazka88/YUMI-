/**
 * Central promo validity and price calculation utility for Zorando.
 * Guarantees 100% consistent behavior across:
 * - Product detail page (Product.tsx)
 * - Product cards in listings (ProductCard.tsx)
 * - Cart state and total (cartStore.ts, Cart.tsx)
 * - Checkout calculations and submission (Checkout.tsx)
 * - Admin product form (Dashboard.tsx)
 */

export interface PromoProduct {
  price: number | string;
  promo_price?: number | string | null;
  promo_price_start_date?: string | Date | null;
  promo_price_end_date?: string | Date | null;
}

/**
 * Checks if a product's promotional price is currently active and valid.
 * A promotion is valid ONLY if:
 * 1. promo_price is a valid positive number strictly less than regular price
 * 2. If promo_price_start_date is defined, start_date <= now
 * 3. If promo_price_end_date is defined, end_date >= now
 */
export const isPromoActive = (product?: PromoProduct | null): boolean => {
  if (!product) return false;
  if (product.promo_price === null || product.promo_price === undefined || product.promo_price === '') return false;
  
  const promo = Number(product.promo_price);
  const regular = Number(product.price);
  
  if (isNaN(promo) || isNaN(regular) || promo <= 0 || promo >= regular) {
    return false;
  }
  
  const now = new Date();
  
  if (product.promo_price_start_date) {
    const start = new Date(product.promo_price_start_date);
    if (!isNaN(start.getTime()) && start > now) {
      return false; // Promo has not started yet
    }
  }
  
  if (product.promo_price_end_date) {
    const end = new Date(product.promo_price_end_date);
    if (!isNaN(end.getTime()) && end < now) {
      return false; // Promo has expired
    }
  }
  
  return true;
};

/**
 * Returns the effective price to charge for an item, taking into account:
 * - Selected variation price (if set)
 * - Active promo price (only if promo is currently valid and active)
 * - Regular price as default
 */
export const getEffectivePrice = (
  product?: PromoProduct | null,
  selectedVariation?: { price?: number | string | null } | null
): number => {
  if (!product) return 0;
  
  if (selectedVariation?.price !== undefined && selectedVariation?.price !== null && selectedVariation?.price !== '') {
    const varPrice = Number(selectedVariation.price);
    if (!isNaN(varPrice) && varPrice > 0) {
      return varPrice;
    }
  }
  
  if (isPromoActive(product)) {
    return Number(product.promo_price);
  }
  
  return Number(product.price) || 0;
};

/**
 * Converts a date value from DB or API to a datetime-local input string (YYYY-MM-DDTHH:mm)
 * preserving local timezone without unwanted UTC offset drift.
 */
export const formatForDateTimeLocal = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};
