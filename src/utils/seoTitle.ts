/**
 * SEO Title Optimization for Search Engines (Google, Bing).
 * Enforces:
 * 1. Strict length limit <= 60 characters to eliminate Bing "Title too long" warnings.
 * 2. Deduplication of brand suffix (prevents '| Zorando | Zorando' or repeated site names).
 * 3. Smart truncation at word boundaries and natural separators.
 */

export function formatSeoTitle(rawTitle: string, brand = 'Zorando', maxLen = 60): string {
  if (!rawTitle || typeof rawTitle !== 'string') return brand;
  let t = rawTitle.trim();

  // Strip all trailing brand occurrences (e.g., '| Zorando', '- ZORANDO', ': Zorando', etc.)
  const brandRegex = new RegExp('\\s*[-–—|:]\\s*' + brand + '\\s*$', 'i');
  while (brandRegex.test(t)) {
    t = t.replace(brandRegex, '').trim();
  }
  // Strip trailing punctuation & separators
  t = t.replace(/[-–—|:,\s]+$/, '').trim();

  if (!t) return brand;

  // If title already contains the brand as a distinct word anywhere inside
  const hasBrandInside = new RegExp('\\b' + brand + '\\b', 'i').test(t);
  if (hasBrandInside) {
    if (t.length <= maxLen) return t;
    // Truncate at word boundary within maxLen
    const truncated = t.slice(0, maxLen).replace(/\s+[^\s]*$/, '').trim();
    return (truncated.length >= 15 ? truncated : t.slice(0, maxLen)).trim();
  }

  const suffix = ` | ${brand}`;
  const maxBase = maxLen - suffix.length; // 50 for maxLen=60 and brand='Zorando'

  if (t.length <= maxBase) {
    return `${t}${suffix}`;
  }

  // If there's a natural separator (-, –, —, :), check if the primary portion fits
  const sepMatch = t.match(/^(.+?)\s+[-–—:]\s+/);
  if (sepMatch && sepMatch[1].length <= maxBase && sepMatch[1].length >= 15) {
    return `${sepMatch[1].trim()}${suffix}`;
  }

  // Truncate at whole word boundary within maxBase
  let truncated = t.slice(0, maxBase).replace(/\s+[^\s]*$/, '').trim();
  if (truncated.length < 15) {
    truncated = t.slice(0, maxBase).trim();
  }
  return `${truncated}${suffix}`;
}
