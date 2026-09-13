const { sql } = require('./dist/server.cjs'); // Might not export sql. Let's just mock.

function buildProductSchema(product, reviews, currentUrl, baseUrl = 'https://www.zorando.com') {
  const isPromo = product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);
  const currentPrice = isPromo ? Number(product.promo_price).toFixed(2) : (!isNaN(Number(product.price)) ? Number(product.price).toFixed(2) : "0.00");
  
  let imageUrl = product.image;
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl}${imageUrl}`;
  } else if (!imageUrl || imageUrl.startsWith('data:image')) {
    imageUrl = `${baseUrl}/api/images/products/${product.id}/image/${product.slug}.webp`;
  }
  
  const images = [];
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

  const uniqueImages = [...new Set(images)];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": uniqueImages.length > 0 ? uniqueImages : undefined,
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

  const offer = {
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
  return schema;
}

console.log(JSON.stringify(buildProductSchema({
  name: 'Tondeuse',
  price: '4500',
  promo_price: '3450',
  stock: 10,
  id: 1,
  slug: 'test',
  image: '/test.jpg'
}, [], 'https://test.com/product/test'), null, 2));

