export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '';
  
  const rounded = Math.round(numPrice);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DA';
}
