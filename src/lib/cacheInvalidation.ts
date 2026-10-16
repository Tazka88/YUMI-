import { sql } from '../db/setup.js';
import { clearCache } from '../api/routes.js';

export interface InvalidationDetails {
  productId: number | string;
  slug?: string;
  reason: 'price_change' | 'promo_change' | 'out_of_stock' | 'restock' | 'product_update';
  oldValue?: any;
  newValue?: any;
}

/**
 * Invalide le cache Vercel / Edge / Mémoire lors d'une modification de prix ou de stock
 */
export async function invalidateProductCache(details: InvalidationDetails) {
  const { productId, slug, reason, oldValue, newValue } = details;
  console.log(`[Cache Invalidation] Product #${productId} (${slug || 'unknown slug'}) - Reason: ${reason}`, { oldValue, newValue });

  try {
    // 1. Mettre à jour updated_at dans la base PostgreSQL pour garantir un ETag frais
    let resolvedSlug = slug;
    if (!resolvedSlug) {
      const [p] = await sql`SELECT slug FROM products WHERE id = ${productId}`;
      if (p) resolvedSlug = p.slug;
    }

    await sql`UPDATE products SET updated_at = NOW() WHERE id = ${productId}`;

    // 2. Vider le cache mémoire de l'API Node / Express
    clearCache('/products');
    clearCache('/api/products');
    if (resolvedSlug) {
      clearCache(`/api/products/${resolvedSlug}`);
      clearCache(`/products/${resolvedSlug}`);
    }

    // 3. Invalidation Vercel Edge Cache via requêtes de revalidation
    if (resolvedSlug) {
      const baseUrl = 'https://www.zorando.com';
      const targetUrls = [
        `${baseUrl}/product/${resolvedSlug}`,
        `${baseUrl}/api/products/${resolvedSlug}`
      ];

      for (const url of targetUrls) {
        // Envoi d'une requête de contournement et rafraîchissement au CDN Vercel
        fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'x-prerender-revalidate': '1',
            'x-vercel-purge': '1',
            'User-Agent': 'Zorando-Cache-Invalidator/1.0'
          }
        }).catch(() => {
          // Non bloquant en arrière-plan
        });
      }
    }

    // 4. Si token Vercel configuré dans les variables d'environnement, appel direct à l'API de purge Vercel
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    if (vercelToken && vercelProjectId) {
      fetch(`https://api.vercel.com/v1/projects/${vercelProjectId}/cache`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paths: resolvedSlug ? [`/product/${resolvedSlug}`, `/api/products/${resolvedSlug}`] : []
        })
      }).catch(err => {
        console.error('[Cache Invalidation] Vercel purge API error:', err);
      });
    }

    return { success: true, slug: resolvedSlug, reason };
  } catch (error) {
    console.error('[Cache Invalidation] Error invalidating cache:', error);
    return { success: false, error };
  }
}
