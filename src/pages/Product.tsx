import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ThumbsUp } from 'lucide-react';
import { useCartStore, Product as ProductType } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import ReactGA from 'react-ga4';
import ReactPixel from 'react-facebook-pixel';

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
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/settings', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setTrackingIds({
          ga: data.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
          fb: data.fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID || ''
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
    fetch(`/api/products/${slug}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error('Produit introuvable');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setSelectedImage(data.image || `https://picsum.photos/seed/${data.slug}/800/800`);
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
    
    // Track Add to Cart
    if (trackingIds.ga && ReactGA && typeof ReactGA.event === 'function') {
      try {
        ReactGA.event("add_to_cart", {
          currency: "DZD",
          value: currentPrice * quantity,
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
        const pixel = (ReactPixel && (ReactPixel as any).default) || ReactPixel;
        if (pixel && typeof pixel.track === 'function') {
          pixel.track('AddToCart', {
            content_name: product.name,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: currentPrice * quantity,
            currency: 'DZD'
          });
        }
      } catch (e) {
        console.error('Failed to send FB add_to_cart event', e);
      }
    }
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
    "image": product.image || `https://picsum.photos/seed/${product.slug}/800/800`,
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
      <SEO 
        title={product.name} 
        description={product.description.substring(0, 150) + '...'} 
        image={product.image || `https://picsum.photos/seed/${product.slug}/800/800`}
        url={window.location.href}
        schema={productSchema}
      />
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <Link to={`/category/${product.category_id}`} className="hover:text-orange-500">{product.category_name || 'Catégorie'}</Link>
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
              />
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                  onClick={() => setSelectedImage(product.image || `https://picsum.photos/seed/${product.slug}/800/800`)}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-white p-1 ${selectedImage === (product.image || `https://picsum.photos/seed/${product.slug}/800/800`) ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img src={product.image || `https://picsum.photos/seed/${product.slug}/800/800`} alt="Main" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
              <Link to={`/brands/${product.brand_slug}`} className="text-orange-600 font-semibold hover:underline mb-2 inline-block">
                Visiter la boutique {product.brand_name}
              </Link>
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

            <div className="mt-auto flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-gray-300 rounded-md bg-white w-32">
                <button 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >-</button>
                <span className="flex-1 text-center font-medium">{quantity}</span>
                <button 
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >+</button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <ShoppingCart size={20} />
                Ajouter au panier
              </button>
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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden flex items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(currentPrice * quantity)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={20} />
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
