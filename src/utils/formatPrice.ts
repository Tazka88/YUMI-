export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '';
  
  const rounded = Math.round(numPrice);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DA';
}

export function isPromoActive(product: {
  promo_price?: number | string | null;
  price?: number | string;
  promo_price_start_date?: string | Date | null;
  promo_price_end_date?: string | Date | null;
} | null | undefined): boolean {
  if (!product) return false;
  if (product.promo_price === null || product.promo_price === undefined) return false;
  const promo = typeof product.promo_price === 'string' ? parseFloat(product.promo_price) : product.promo_price;
  const reg = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
  if (isNaN(promo) || promo <= 0) return false;
  if (!isNaN(reg) && reg > 0 && promo >= reg) return false;

  const now = new Date();
  if (product.promo_price_start_date) {
    const start = new Date(product.promo_price_start_date);
    if (!isNaN(start.getTime()) && start > now) return false;
  }
  if (product.promo_price_end_date) {
    const end = new Date(product.promo_price_end_date);
    if (!isNaN(end.getTime()) && end < now) return false;
  }
  return true;
}

export function getProductEffectivePrice(product: {
  price?: number | string;
  promo_price?: number | string | null;
  promo_price_start_date?: string | Date | null;
  promo_price_end_date?: string | Date | null;
  selectedVariation?: any;
} | null | undefined): number {
  if (!product) return 0;
  if (product.selectedVariation?.price) {
    const varPrice = typeof product.selectedVariation.price === 'string' ? parseFloat(product.selectedVariation.price) : product.selectedVariation.price;
    if (!isNaN(varPrice) && varPrice > 0) return varPrice;
  }
  if (isPromoActive(product)) {
    const promo = typeof product.promo_price === 'string' ? parseFloat(product.promo_price) : product.promo_price;
    if (typeof promo === 'number' && !isNaN(promo) && promo > 0) return promo;
  }
  const reg = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
  return (!isNaN(reg) && reg > 0) ? reg : 0;
}
