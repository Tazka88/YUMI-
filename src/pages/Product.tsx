import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ThumbsUp, Facebook, Instagram, MessageCircle, CreditCard, ArrowDown, Phone } from 'lucide-react';
import { useCartStore, Product as ProductType } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });
  const [settings, setSettings] = useState<any>({});
  const addItem = useCartStore(state => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/settings', { signal: controller.signal })
      .then(data => {
        setSettings(data);
        setTrackingIds({
          ga: (data as any).ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
          fb: (data as any).fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID || ''
        });
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setError(null);
    fetch(`/api/products/${slug}`, { signal, priority: 'high' } as any)
      .then(res => {
        if (!res.ok) throw new Error('Produit introuvable');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setSelectedImage(data.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=800`);
        
        // Increment view count
        fetch(`/api/products/${data.id}/view`, { method: 'POST', signal }).catch(console.error);

        // Fetch related
        fetch(`/api/products?category=${data.category_id}`, { signal })
          .then(res => res.json())
          .then(related => {
            if (Array.isArray(related)) {
              setRelatedProducts(related.filter((p: ProductType) => p.id !== data.id).slice(0, 4));
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') console.error(err);
          });
          
        // Fetch reviews
        fetch(`/api/products/${slug}/reviews`, { signal })
          .then(res => res.json())
          .then(reviewsData => {
            if (Array.isArray(reviewsData)) {
              setReviews(reviewsData);
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError') console.error(err);
          });
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError(err.message);
        }
      });
      
    return () => controller.abort();
  }, [slug]);

  const viewContentTrackedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (product && trackingIds.fb && viewContentTrackedRef.current !== product.id.toString()) {
      viewContentTrackedRef.current = product.id.toString();
      const eventId = generateEventId();
      const currentPrice = (product.promo_price !== null && product.promo_price !== undefined) ? Number(product.promo_price) : Number(product.price);
      const safeValue = isNaN(currentPrice) || currentPrice <= 0 ? 1 : Number(currentPrice.toFixed(2));
      const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('yumidz.vercel.app');
      
      try {
        // Use window.fbq directly to ensure eventID is passed correctly (ReactPixel wrapper sometimes drops the 3rd argument)
        if (isProduction && typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }, { eventID: eventId });
        }
        
        sendCapiEvent({
          eventName: 'ViewContent',
          eventId: eventId,
          customData: {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }
        });
      } catch (e) {
        console.error('Failed to send ViewContent event', e);
      }
    }
  }, [product?.id, trackingIds.fb]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Oups !</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-md">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      </div>
    );
  }

  const isPromo = product.promo_price !== null;
  const discount = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;
  const currentPrice = isPromo ? product.promo_price! : product.price;

  const handleAddToCart = () => {
    addItem(product, quantity);
    
    const safeValue = isNaN(currentPrice * quantity) || (currentPrice * quantity) <= 0 ? 1 : Number(Number(currentPrice * quantity).toFixed(2));

    // Track Add to Cart
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag("event", "add_to_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: product.id.toString(),
            item_name: product.name,
            price: currentPrice,
            quantity: quantity
          }]
        });
      } catch (e) {
        console.error('Failed to send GA add_to_cart event', e);
      }
    }
    
    if (trackingIds.fb) {
      try {
        const eventId = generateEventId();
        const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('yumidz.vercel.app');
        
        if (isProduction && typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'AddToCart', {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }, { eventID: eventId });
        }
        
        sendCapiEvent({
          eventName: 'AddToCart',
          eventId: eventId,
          customData: {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: safeValue,
            currency: 'DZD'
          }
        });
      } catch (e) {
        console.error('Failed to send FB add_to_cart event', e);
      }
    }
  };

  const handleBuyNow = () => {
    navigate('/checkout', { state: { directBuyItem: { ...product, quantity } } });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.comment) return;
    
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: reviewForm.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      if (res.ok) {
        setReviewForm({ name: '', rating: 5, comment: '' });
        fetch(`/api/products/${slug}/reviews`)
          .then(res => res.json())
          .then(setReviews)
          .catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`,
    "description": product.description,
    "sku": product.id.toString(),
    "brand": {
      "@type": "Brand",
      "name": product.brand_name || "Yumi"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "DZD",
      "price": currentPrice,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    ...(reviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": avgRating,
        "reviewCount": reviews.length
      }
    })
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <h1 className="sr-only">{product.name}</h1>
      <SEO 
        title={product.name} 
        description={product.description.substring(0, 150) + '...'} 
        image={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`}
        url={window.location.href}
        schema={productSchema}
      />
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <Link to={`/category/${product.category_id}`} className="hover:text-orange-500">{product.category_name || 'Catégorie'}</Link>
        {product.subcategory_name && (
          <>
            <span>/</span>
            <Link to={`/category/${product.subcategory_id}?sub=true`} className="hover:text-orange-500">{product.subcategory_name}</Link>
          </>
        )}
        {product.sub_subcategory_name && (
          <>
            <span>/</span>
            <Link to={`/category/${product.sub_subcategory_id}?subsub=true`} className="hover:text-orange-500">{product.sub_subcategory_name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col gap-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              {isPromo && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded z-10">
                  -{discount}%
                </div>
              )}
              <img 
                src={selectedImage} 
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                fetchPriority="high"
                loading="eager"
              />
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                  onClick={() => setSelectedImage(product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`)}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-white p-1 ${selectedImage === (product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`) ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`} alt="Main" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
                {product.images.map((img: any) => (
                  <button 
                    key={img.id}
                    onClick={() => setSelectedImage(img.image)}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-white p-1 ${selectedImage === img.image ? 'border-orange-500' : 'border-transparent'}`}
                  >
                    <img src={img.image} alt="Thumbnail" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
            {product.brand_name && (
              product.brand_slug ? (
                <Link to={`/brands/${product.brand_slug}`} className="text-orange-600 font-semibold hover:underline mb-2 inline-block">
                  Visiter la boutique {product.brand_name}
                </Link>
              ) : (
                <span className="text-gray-500 font-medium mb-2 inline-block">
                  Marque : {product.brand_name}
                </span>
              )
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex text-orange-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} fill={star <= parseFloat(avgRating) ? "currentColor" : "none"} size={18} />
                ))}
              </div>
              <span className="text-sm text-orange-500 hover:underline cursor-pointer">({reviews.length} avis vérifiés)</span>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
              {isPromo ? (
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-orange-600">{formatPrice(product.promo_price)}</span>
                  <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <span className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Key Points Section */}
            {product.key_points && product.key_points.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">À propos de cet article</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {product.key_points.map((point: string, idx: number) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <span className="font-medium text-gray-700 mr-2">Disponibilité:</span>
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">En stock ({product.stock} restants)</span>
              ) : (
                <span className="text-red-500 font-medium">Rupture de stock</span>
              )}
            </div>

            {/* Reassurance Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <Truck size={24} className="text-orange-500 mb-2" />
                <span className="text-xs font-bold text-gray-800">Livraison Rapide</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <RotateCcw size={24} className="text-orange-500 mb-2" />
                <span className="text-xs font-bold text-gray-800">Retour Facile</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <ShieldCheck size={24} className="text-orange-500 mb-2" />
                <span className="text-xs font-bold text-gray-800">Paiement Sécurisé</span>
              </div>
            </div>

            {/* Info Boxes */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <Truck className="text-blue-500 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Livraison</h4>
                  <p className="text-xs text-gray-600 mt-1">Livraison disponible partout en Algérie (58 wilayas)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50/50 border border-green-100 rounded-lg">
                <CreditCard className="text-green-500 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Paiement</h4>
                  <p className="text-xs text-gray-600 mt-1">Paiement à la livraison disponible</p>
                </div>
              </div>
            </div>

            {/* Social Share & Scroll Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Partager :</span>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                  <Facebook size={16} />
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm">
                  <MessageCircle size={16} />
                </a>
                <a href={`https://www.instagram.com/`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white hover:opacity-90 transition-opacity shadow-sm">
                  <Instagram size={16} />
                </a>
              </div>
              <button 
                onClick={() => document.getElementById('description')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 transition-colors"
              >
                Voir la description complète <ArrowDown size={16} />
              </button>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-md bg-white h-12 w-full sm:w-32 shrink-0">
                  <button 
                    className="px-4 h-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >-</button>
                  <span className="flex-1 text-center font-medium">{quantity}</span>
                  <button 
                    className="px-4 h-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >+</button>
                </div>
                
                <button 
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6 rounded-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-lg"
                >
                  J'achète
                </button>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
                  className="flex items-center justify-center w-12 h-12 rounded-md border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-colors shrink-0"
                >
                  <Phone size={24} />
                </a>
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold h-12 px-6 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-500">
            <Truck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Livraison Rapide</h4>
            <p className="text-xs text-gray-500">Partout en Algérie (58 wilayas)</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Paiement Sécurisé</h4>
            <p className="text-xs text-gray-500">Paiement à la livraison (Cash)</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-500">
            <RotateCcw size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Retour Facile</h4>
            <p className="text-xs text-gray-500">Sous 7 jours si défectueux</p>
          </div>
        </div>
      </div>

      {/* Product Description Section */}
      <div id="description" className="bg-white rounded-lg shadow-sm p-6 mb-12 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Description du produit</h2>
        <div className="prose max-w-none text-gray-700">
          {product.description ? (
            <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
          ) : (
            <p className="text-gray-500 italic">Aucune description détaillée disponible pour ce produit.</p>
          )}
        </div>
      </div>

      {/* Features Section */}
      {product.features && (typeof product.features === 'string' ? product.features.trim().length > 0 : product.features.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Caractéristiques techniques</h2>
          {typeof product.features === 'string' ? (
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-line leading-relaxed">{product.features}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-200">
                <tbody>
                  {product.features.map((feature: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4 border border-gray-200 font-medium text-gray-700 w-1/3 bg-gray-100">{feature.key}</td>
                      <td className="py-3 px-4 border border-gray-200 text-gray-600">{feature.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Avis Clients</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="text-center mb-8">
              <div className="text-5xl font-black text-gray-900 mb-2">{avgRating}</div>
              <div className="flex justify-center text-orange-400 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} fill={star <= Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={20} />
                ))}
              </div>
              <p className="text-sm text-gray-500">Basé sur {reviews.length} avis</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">Laisser un avis</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    value={reviewForm.name}
                    onChange={e => setReviewForm({...reviewForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className={`${reviewForm.rating >= star ? 'text-orange-400' : 'text-gray-300'} hover:text-orange-400 transition-colors`}
                      >
                        <Star fill="currentColor" size={24} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire *</label>
                  <textarea 
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 resize-none"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Envoi...' : 'Envoyer mon avis'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="w-full md:w-2/3 space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun avis pour le moment. Soyez le premier à donner votre avis !
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{review.customer_name}</span>
                    <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-orange-400 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} fill={star <= review.rating ? "currentColor" : "none"} size={14} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Products (Cross-sell) */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-orange-500 inline-block pb-2">Produits Similaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Mobile Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 md:hidden flex items-center justify-between gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a 
          href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
          className="flex items-center justify-center w-12 h-12 rounded-md border-2 border-orange-500 text-orange-500 shrink-0"
        >
          <Phone size={24} />
        </a>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex items-center justify-center w-12 h-12 rounded-md bg-orange-500 text-white shrink-0 disabled:opacity-50"
        >
          <ShoppingCart size={24} />
        </button>
        <button
          onClick={handleBuyNow}
          disabled={product.stock === 0}
          className="flex-1 bg-orange-500 text-white h-12 rounded-md font-bold text-lg flex items-center justify-center disabled:opacity-50"
        >
          J'achète
        </button>
      </div>
    </div>
  );
}
