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

export function buildProductSchema(product: any, reviews: any[], currentUrl: string, baseUrl: string = 'https://www.zorando.com') {
  const now = new Date();
  let isPromoValid = false;
  if (product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price)) {
    isPromoValid = true;
    if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
    if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
  }

  const basePriceNum = isPromoValid ? Number(product.promo_price) : Number(product.price);
  const currentPrice = !isNaN(basePriceNum) && basePriceNum > 0 ? basePriceNum.toFixed(2) : "0.00";

  let imageUrl = product.image;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl}${imageUrl}`;
  } else if (!imageUrl || imageUrl.startsWith('data:image')) {
    imageUrl = `${baseUrl}/api/images/products/${product.id}/image/${product.slug}.webp`;
  }

  const images: string[] = [];
  if (imageUrl) images.push(imageUrl);
  
  if (product.images && Array.isArray(product.images)) {
    for (let img of product.images) {
      const imgStr = typeof img === 'string' ? img : img?.image;
      if (imgStr && typeof imgStr === 'string') {
        if (imgStr.startsWith('/')) {
          images.push(`${baseUrl}${imgStr}`);
        } else {
          images.push(imgStr);
        }
      }
    }
  }

  // Deduplicate array
  const uniqueImages = [...new Set(images)];

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": uniqueImages.length > 0 ? uniqueImages : undefined,
    "description": product.description ? product.description.substring(0, 5000).replace(/<[^>]+>/g, '') : '',
  };

  if (product.sku) {
    schema.sku = product.sku;
  }

  const brandName = product.brand_name || (product.brand && product.brand.name) || "Zorando";
  schema.brand = {
    "@type": "Brand",
    "name": brandName
  };

  const isStockAvailable = product.stock !== undefined && product.stock !== null && (Number(product.stock) > 0 || product.stock === true);
  const cleanOfferUrl = currentUrl.split('?')[0];

  // Parse variations if present
  let variationsList: any[] = [];
  if (typeof product.variations === 'string' && product.variations.trim().length > 2) {
    try {
      variationsList = JSON.parse(product.variations);
    } catch (e) {
      variationsList = [];
    }
  } else if (Array.isArray(product.variations)) {
    variationsList = product.variations;
  }

  const variationPrices = variationsList
    .map((v: any) => v && v.price ? Number(v.price) : null)
    .filter((p): p is number => p !== null && !isNaN(p) && p > 0);

  const hasMultiplePrices = variationPrices.length > 0 && (
    Math.min(...variationPrices) !== Math.max(...variationPrices) ||
    variationPrices.some(p => p !== basePriceNum)
  );

  const commonShippingAndReturns = {
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Zorando",
      "url": "https://www.zorando.com"
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "DZ",
      "returnPolicyCountry": "DZ",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 7,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "600",
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

  const getPriceValidUntil = () => {
    if (isPromoValid && product.promo_price_end_date) {
      const endDate = new Date(product.promo_price_end_date);
      if (endDate > now) {
        return endDate.toISOString().split('T')[0];
      }
    }
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  };

  if (hasMultiplePrices) {
    const allPrices = [basePriceNum, ...variationPrices].filter(p => !isNaN(p) && p > 0);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    schema.offers = {
      "@type": "AggregateOffer",
      "url": cleanOfferUrl,
      "priceCurrency": "DZD",
      "lowPrice": minPrice.toFixed(2),
      "highPrice": maxPrice.toFixed(2),
      "offerCount": variationsList.length || 1,
      "priceValidUntil": getPriceValidUntil(),
      "availability": isStockAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...commonShippingAndReturns
    };
  } else {
    schema.offers = {
      "@type": "Offer",
      "url": cleanOfferUrl,
      "priceCurrency": "DZD",
      "price": currentPrice,
      "priceValidUntil": getPriceValidUntil(),
      "availability": isStockAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...commonShippingAndReturns
    };
  }

  const reviewCount = reviews?.length > 0 ? reviews.length : Number(product.reviews_count || 0);

  if (reviewCount > 0) {
    let avgRating = Number(product.avg_rating || 0);
    if (avgRating < 1 && reviewCount > 0) avgRating = 5;
    if (reviews && reviews.length > 0) {
      avgRating = Number((reviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / reviews.length).toFixed(1));
    }

    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": reviewCount,
      "bestRating": 5,
      "worstRating": 1
    };

    if (reviews && reviews.length > 0) {
      schema.review = reviews.map((r: any) => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.customer_name
        },
        "datePublished": new Date(r.created_at).toISOString().split('T')[0],
        "reviewBody": r.comment,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": Number(r.rating),
          "bestRating": 5,
          "worstRating": 1
        }
      }));
    }
  }

  return schema;
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
