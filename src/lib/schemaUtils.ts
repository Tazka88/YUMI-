export function buildBreadcrumbSchema(items: { name: string; item: string }[]) {
  if (!items || items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.item
    }))
  };
}

export function buildItemListSchema(
  name: string,
  products: { slug: string }[],
  baseUrl: string = 'https://www.zorando.com'
) {
  if (!products || !Array.isArray(products) || products.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": name,
    "numberOfItems": products.length,
    "itemListElement": products.map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${baseUrl}/product/${p.slug}`
    }))
  };
}

export function buildProductSchema(product: any, reviews: any[], currentUrl: string, baseUrl: string = 'https://www.zorando.com') {
  const now = new Date();
  let isPromoValid = false;
  if (product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price)) {
    isPromoValid = true;
    if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
    if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
  }

  const basePriceNum = isPromoValid ? Number(product.promo_price) : Number(product.price);
  const currentPrice = !isNaN(basePriceNum) && basePriceNum > 0 
    ? (Number.isInteger(basePriceNum) ? String(basePriceNum) : basePriceNum.toFixed(2)) 
    : "0";

  // Helper to convert any image path into a full, valid, absolute HTTPS URL
  const formatAbsoluteImageUrl = (rawUrl: any): string | null => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith('data:image')) return null;

    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    if (trimmed.startsWith('http://')) {
      return trimmed.replace(/^http:\/\//, 'https://');
    }
    if (trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Handle Supabase storage relative paths (e.g. storage/v1/object/public/... or /storage/v1/object/public/...)
    if (trimmed.startsWith('/storage/v1/') || trimmed.startsWith('storage/v1/')) {
      const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      const supabaseBase = process.env.VITE_SUPABASE_URL || 'https://evvbhalgyffagsesmvhu.supabase.co';
      return `${supabaseBase.replace(/\/+$/, '')}${cleanPath}`;
    }
    if (trimmed.startsWith('/')) {
      return `${baseUrl}${trimmed}`;
    }
    return `${baseUrl}/${trimmed}`;
  };

  const images: string[] = [];
  const primaryImg = formatAbsoluteImageUrl(product.image);
  if (primaryImg) {
    images.push(primaryImg);
  } else if (product.id && product.slug) {
    images.push(`${baseUrl}/api/images/products/${product.id}/image/${product.slug}.webp`);
  }

  if (product.images && Array.isArray(product.images)) {
    for (let img of product.images) {
      const imgStr = typeof img === 'string' ? img : img?.image;
      const formatted = formatAbsoluteImageUrl(imgStr);
      if (formatted) images.push(formatted);
    }
  }

  // Deduplicate array
  let uniqueImages = [...new Set(images)];

  // Fallback image: Requirement states "au moins 1, jamais vide ni null. Si un produit n'a pas d'image, utilise une image de secours valide plutôt que d'omettre le champ"
  if (uniqueImages.length === 0) {
    uniqueImages = [`${baseUrl}/og-image-fb.jpg`];
  }

  // Truncate name cleanly on word boundary to max 150 characters without trailing space/punctuation
  const truncateName = (str: string, max: number = 150): string => {
    if (!str) return 'Produit ZORANDO';
    const trimmed = str.trim();
    if (trimmed.length <= max) return trimmed;
    let cut = trimmed.substring(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) cut = cut.substring(0, lastSpace);
    cut = cut.replace(/[\s\-_|,.:;]+$/, '').trim();
    cut = cut.replace(/\s+(?:en|de|du|des|le|la|les|pour|avec|et|ou|a|à|par|sur|sans)$/i, '').trim();
    return cut.replace(/[\s\-_|,.:;]+$/, '').trim();
  };
  const cleanName = truncateName(product.name || 'Produit ZORANDO', 150);

  const brandName = (product.brand_name || (product.brand && product.brand.name) || "ZORANDO").trim();

  // Clean description: strip HTML, 5000 max, fallback to default format if empty
  let rawDescription = '';
  if (product.description && typeof product.description === 'string') {
    rawDescription = product.description;
  } else if (product.seo_description && typeof product.seo_description === 'string') {
    rawDescription = product.seo_description;
  }

  let cleanDesc = rawDescription
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanDesc) {
    cleanDesc = `${cleanName} - ${brandName} - disponible en Algérie chez ZORANDO`;
  } else if (cleanDesc.length > 5000) {
    let cutDesc = cleanDesc.substring(0, 5000);
    const lastSpace = cutDesc.lastIndexOf(' ');
    if (lastSpace > 0) cutDesc = cutDesc.substring(0, lastSpace);
    cleanDesc = cutDesc.trim();
  }

  // SKU: sku du produit, sinon l'id
  const sku = product.sku && String(product.sku).trim() 
    ? String(product.sku).trim() 
    : (product.id ? String(product.id) : undefined);

  // MPN: modèle (ex. KM-1260) si disponible
  let mpn: string | undefined = undefined;
  if (product.mpn && String(product.mpn).trim()) {
    mpn = String(product.mpn).trim();
  } else if (product.model && String(product.model).trim()) {
    mpn = String(product.model).trim();
  } else if (product.model_number && String(product.model_number).trim()) {
    mpn = String(product.model_number).trim();
  } else if (Array.isArray(product.features)) {
    const modelFeature = product.features.find((f: any) => 
      f && typeof f.key === 'string' && /^(mod[eè]le|model|référence|ref)$/i.test(f.key.trim())
    );
    if (modelFeature && modelFeature.value && String(modelFeature.value).trim()) {
      mpn = String(modelFeature.value).trim();
    }
  }
  if (!mpn && product.name) {
    const match = product.name.match(/\b(KM[- ]?[0-9A-Z]{2,6}|MS[- ]?[0-9A-Z]{2,6}|PC[- ]?[0-9A-Z]{2,6}|[A-Z]{2,4}[-][0-9A-Z]{2,6})\b/i);
    if (match && match[1]) {
      mpn = match[1].replace(' ', '-').toUpperCase();
    }
  }

  // GTIN: uniquement si le code-barres existe en base, sinon omettre
  let gtin: string | undefined = undefined;
  if (product.gtin && String(product.gtin).trim()) {
    gtin = String(product.gtin).trim();
  } else if (product.barcode && String(product.barcode).trim()) {
    gtin = String(product.barcode).trim();
  } else if (product.ean && String(product.ean).trim()) {
    gtin = String(product.ean).trim();
  } else if (product.upc && String(product.upc).trim()) {
    gtin = String(product.upc).trim();
  }

  const isStockAvailable = product.stock !== undefined && product.stock !== null && (Number(product.stock) > 0 || product.stock === true);
  let cleanOfferUrl = currentUrl ? currentUrl.split('?')[0] : `${baseUrl}/product/${product.slug}`;
  if (!cleanOfferUrl.startsWith('http')) {
    cleanOfferUrl = `${baseUrl}${cleanOfferUrl.startsWith('/') ? '' : '/'}${cleanOfferUrl}`;
  }

  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const priceValidUntil = oneYearLater.toISOString().split('T')[0];

  const validFrom = product.created_at 
    ? new Date(product.created_at).toISOString().split('T')[0] 
    : now.toISOString().split('T')[0];

  // Livraison : 0 DA si seuil >= 10 000 DA, sinon 600 DA (tarif wilaya le plus courant et fallback par défaut)
  const shippingRateValue = basePriceNum >= 10000 ? "0" : "600";

  const offers: any = {
    "@type": "Offer",
    "url": cleanOfferUrl,
    "priceCurrency": "DZD",
    "price": currentPrice,
    "priceValidUntil": priceValidUntil,
    "validFrom": validFrom,
    "availability": isStockAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "ZORANDO"
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "DZ",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 7,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": shippingRateValue,
        "currency": "DZD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "DZ"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "DAY"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 3,
          "unitCode": "DAY"
        }
      }
    }
  };

  // Pas de aggregateRating ni de review sans vrais avis
  let aggregateRating: any = undefined;
  let reviewList: any = undefined;

  if (reviews && Array.isArray(reviews) && reviews.length > 0) {
    const validReviews = reviews.filter((r: any) => r && !isNaN(Number(r.rating)) && Number(r.rating) > 0);
    if (validReviews.length > 0) {
      const avgRating = Number((validReviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / validReviews.length).toFixed(1));
      aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": avgRating,
        "reviewCount": validReviews.length,
        "bestRating": 5,
        "worstRating": 1
      };

      reviewList = validReviews.map((r: any) => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.customer_name || 'Client ZORANDO'
        },
        "datePublished": r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : now.toISOString().split('T')[0],
        "reviewBody": r.comment || '',
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": Number(r.rating),
          "bestRating": 5,
          "worstRating": 1
        }
      }));
    }
  }

  // Recursive cleaner to ensure no field is null, undefined, "" or NaN
  const cleanSchema = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      const cleanedArr = obj
        .map(cleanSchema)
        .filter(item => item !== null && item !== undefined && item !== '' && !Number.isNaN(item));
      return cleanedArr.length > 0 ? cleanedArr : undefined;
    }
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '' || Number.isNaN(value)) {
        continue;
      }
      const cleanedVal = cleanSchema(value);
      if (cleanedVal !== null && cleanedVal !== undefined && cleanedVal !== '' && !Number.isNaN(cleanedVal)) {
        result[key] = cleanedVal;
      }
    }
    return result;
  };

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": cleanName,
    "description": cleanDesc,
    "image": uniqueImages,
    "sku": sku,
    "mpn": mpn,
    "gtin": gtin,
    "brand": {
      "@type": "Brand",
      "name": brandName
    },
    "offers": offers,
    "aggregateRating": aggregateRating,
    "review": reviewList
  };

  return cleanSchema(schema);
}

export function buildOrganizationSchema(baseUrl: string = 'https://www.zorando.com') {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": "ZORANDO",
    "alternateName": "ZORANDO Algérie",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "telephone": "+213781955925",
    "email": "contact@zorando.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Cité 8 Mai 1945, UV 06, Bâtiment 18, N° 32",
      "addressLocality": "Bab Ezzouar",
      "addressRegion": "Alger",
      "postalCode": "16000",
      "addressCountry": "DZ"
    },
    "sameAs": [
      "https://www.facebook.com/zorandodz",
      "https://www.instagram.com/zorandoalgerie/?hl=fr"
    ]
  };
}

export function buildWebSiteSchema(baseUrl: string = 'https://www.zorando.com') {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ZORANDO",
    "url": baseUrl
  };
}

export function buildBlogSchema(post: any, currentUrl: string, baseUrl: string = 'https://www.zorando.com') {
  let imageUrl = post.main_image || post.image_url;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl}${imageUrl}`;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.seo_title || post.title,
    "description": post.seo_description || post.excerpt,
    "image": imageUrl ? [imageUrl] : [],
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "ZORANDO",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZORANDO",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    }
  };
}

/**
 * Tronque un texte sans couper les mots et nettoie la ponctuation finale.
 * @param text - Le texte à tronquer (ex: description du produit)
 * @param maxLength - La longueur maximale souhaitée (ex: 155 pour une meta description)
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  // Coupe au dernier espace pour ne pas couper un mot en deux
  const truncated = text.substring(0, text.lastIndexOf(' ', maxLength));
  
  // Nettoie les tirets, points de suspension ou espaces suspendus à la fin
  const cleaned = truncated.replace(/[-–—\s]+$/, '');
  
  return cleaned + (cleaned.length < text.length ? '...' : '');
}
