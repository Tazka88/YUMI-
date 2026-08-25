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
  const isPromo = product.promo_price && Number(product.promo_price) < Number(product.price);
  const currentPrice = isPromo ? Number(product.promo_price).toFixed(2) : Number(product.price).toFixed(2);

  let imageUrl = product.image;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl}${imageUrl}`;
  } else if (!imageUrl || imageUrl.startsWith('data:image')) {
    imageUrl = `${baseUrl}/api/images/products/${product.id}/image/${product.slug}.webp`;
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": imageUrl,
    "description": product.description ? product.description.substring(0, 5000).replace(/<[^>]+>/g, '') : '',
  };

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.brand_name) {
    schema.brand = {
      "@type": "Brand",
      "name": product.brand_name
    };
  }

  const offer: any = {
    "@type": "Offer",
    "url": currentUrl,
    "priceCurrency": "DZD",
    "price": currentPrice,
    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Zorando",
      "url": "https://www.zorando.com"
    }
  };

  if (isPromo && product.promo_price_end_date) {
    const endDate = new Date(product.promo_price_end_date);
    if (endDate > new Date()) {
      offer.priceValidUntil = endDate.toISOString().split('T')[0];
    } else {
      offer.priceValidUntil = "2027-12-31";
    }
  } else {
    offer.priceValidUntil = "2027-12-31";
  }

  schema.offers = offer;

  const reviewCount = reviews?.length > 0 ? reviews.length : Number(product.reviews_count || 0);

  if (reviewCount > 0) {
    let avgRating = Number(product.avg_rating || 0);
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
    "@type": "Organization",
    "name": "ZORANDO",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`
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
