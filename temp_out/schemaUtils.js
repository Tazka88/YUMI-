"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBreadcrumbSchema = buildBreadcrumbSchema;
exports.buildProductSchema = buildProductSchema;
exports.buildOrganizationSchema = buildOrganizationSchema;
exports.buildWebSiteSchema = buildWebSiteSchema;
exports.buildBlogSchema = buildBlogSchema;
function buildBreadcrumbSchema(items) {
    if (!items || items.length < 2)
        return null;
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map(function (breadcrumb, index) { return ({
            "@type": "ListItem",
            "position": index + 1,
            "name": breadcrumb.name,
            "item": breadcrumb.item
        }); })
    };
}
function buildProductSchema(product, reviews, currentUrl, baseUrl) {
    if (baseUrl === void 0) { baseUrl = 'https://www.zorando.com'; }
    var isPromo = product.promo_price && Number(product.promo_price) < Number(product.price);
    var currentPrice = isPromo ? Number(product.promo_price) : Number(product.price);
    var imageUrl = product.image;
    if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = "".concat(baseUrl).concat(imageUrl);
    }
    else if (!imageUrl || imageUrl.startsWith('data:image')) {
        imageUrl = "".concat(baseUrl, "/api/images/products/").concat(product.id, "/image/").concat(product.slug, ".webp");
    }
    var schema = {
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
    var offer = {
        "@type": "Offer",
        "url": currentUrl,
        "priceCurrency": "DZD",
        "price": currentPrice,
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
    };
    if (isPromo && product.promo_price_end_date) {
        var endDate = new Date(product.promo_price_end_date);
        if (endDate > new Date()) {
            offer.priceValidUntil = endDate.toISOString().split('T')[0];
        }
    }
    schema.offers = offer;
    var reviewCount = (reviews === null || reviews === void 0 ? void 0 : reviews.length) > 0 ? reviews.length : Number(product.reviews_count || 0);
    if (reviewCount > 0) {
        var avgRating = Number(product.avg_rating || 0);
        if (reviews && reviews.length > 0) {
            avgRating = Number((reviews.reduce(function (acc, r) { return acc + Number(r.rating); }, 0) / reviews.length).toFixed(1));
        }
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": reviewCount,
            "bestRating": 5,
            "worstRating": 1
        };
        if (reviews && reviews.length > 0) {
            schema.review = reviews.map(function (r) { return ({
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
            }); });
        }
    }
    return schema;
}
function buildOrganizationSchema(baseUrl) {
    if (baseUrl === void 0) { baseUrl = 'https://www.zorando.com'; }
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "ZORANDO",
        "url": baseUrl,
        "logo": "".concat(baseUrl, "/logo.png")
    };
}
function buildWebSiteSchema(baseUrl) {
    if (baseUrl === void 0) { baseUrl = 'https://www.zorando.com'; }
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "ZORANDO",
        "url": baseUrl
    };
}
function buildBlogSchema(post, currentUrl, baseUrl) {
    if (baseUrl === void 0) { baseUrl = 'https://www.zorando.com'; }
    var imageUrl = post.main_image || post.image_url;
    if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = "".concat(baseUrl).concat(imageUrl);
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
                "url": "".concat(baseUrl, "/logo.png")
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": currentUrl
        }
    };
}
