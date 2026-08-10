const fs = require('fs');
let code = fs.readFileSync('src/pages/Product.tsx', 'utf8');

// replace the schema logic
const schemaLogicStart = code.indexOf('const avgRating =');
const schemaLogicEnd = code.indexOf('return (', schemaLogicStart);
if (schemaLogicStart !== -1 && schemaLogicEnd !== -1) {
  const newSchemaLogic = `
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const rawUrl = window.location.href;
  let cleanUrl = rawUrl.split('?')[0];
  cleanUrl = cleanUrl.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com');
  if (cleanUrl.length > 'https://www.zorando.com/'.length && cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  const productSchema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(product.name)}&background=random&size=800\`,
    "description": product.description,
    "sku": product.sku || product.id.toString(),
    "mpn": product.sku || product.id.toString(),
    "category": product.category_name || "General",
    "brand": {
      "@type": "Brand",
      "name": product.brand_name || "ZORANDO"
    },
    "offers": {
      "@type": "Offer",
      "url": cleanUrl,
      "priceCurrency": "DZD",
      "price": currentPrice,
      "priceValidUntil": (isPromo && product.promo_price_end_date) ? new Date(product.promo_price_end_date).toISOString().split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": settings?.shipping_base_price || 400,
          "currency": "DZD"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 7,
            "unitCode": "d"
          }
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "DZ"
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "DZ",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    }
  };

  if (reviews.length > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": Number(avgRating),
      "reviewCount": reviews.length,
      "bestRating": 5,
      "worstRating": 1
    };

    productSchema.review = reviews.map(r => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.customer_name
      },
      "datePublished": new Date(r.created_at).toISOString().split('T')[0],
      "reviewBody": r.comment,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }));
  }

  const breadcrumbList = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://www.zorando.com/"
    }
  ];

  let position = 2;
  if (product.category_slug) {
    breadcrumbList.push({
      "@type": "ListItem",
      "position": position++,
      "name": product.category_name || "Catégorie",
      "item": \`https://www.zorando.com/category/\${product.category_slug}\`
    });
  }
  
  if (product.subcategory_slug) {
    breadcrumbList.push({
      "@type": "ListItem",
      "position": position++,
      "name": product.subcategory_name || "Sous-catégorie",
      "item": \`https://www.zorando.com/category/\${product.category_slug}/\${product.subcategory_slug}\`
    });
  }

  breadcrumbList.push({
    "@type": "ListItem",
    "position": position,
    "name": product.name,
    "item": cleanUrl
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbList
  };

  const finalSchema = [productSchema, breadcrumbSchema];

  `;

  code = code.substring(0, schemaLogicStart) + newSchemaLogic + code.substring(schemaLogicEnd);
}

// Update the SEO component call to use finalSchema
code = code.replace(
  'schema={productSchema}',
  'schema={finalSchema}'
);
// Also update the clean URL in SEO component
code = code.replace(
  'url={window.location.href}',
  'url={cleanUrl}'
);


fs.writeFileSync('src/pages/Product.tsx', code);
