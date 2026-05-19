import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ThumbsUp, Facebook, Instagram, MessageCircle, CreditCard, ArrowDown, Phone, Play, Youtube, ChevronDown, HelpCircle, Camera, X, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, Product as ProductType } from '../store/cartStore';
import { useAuth } from '../lib/AuthContext';
import { getSupabase } from '../lib/supabase';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';

const COLOR_MAP: Record<string, string> = {
  'noir': '#000000',
  'black': '#000000',
  'blanc': '#FFFFFF',
  'white': '#FFFFFF',
  'rouge': '#FF0000',
  'red': '#FF0000',
  'bleu': '#0000FF',
  'blue': '#0000FF',
  'vert': '#008000',
  'green': '#008000',
  'jaune': '#FFFF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'rose': '#FFC0CB',
  'pink': '#FFC0CB',
  'violet': '#EE82EE',
  'purple': '#800080',
  'gris': '#808080',
  'gray': '#808080',
  'grey': '#808080',
  'marron': '#A52A2A',
  'brown': '#A52A2A',
  'beige': '#F5F5DC',
  'doré': '#FFD700',
  'or': '#FFD700',
  'gold': '#FFD700',
  'argent': '#C0C0C0',
  'silver': '#C0C0C0',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'marine': '#000080',
  'bordeaux': '#800000'
};

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', url: string, alt_text?: string}>({type: 'image', url: '', alt_text: ''});
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [showOptionsHighlight, setShowOptionsHighlight] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<number | null>(null);
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });
  const [settings, setSettings] = useState<any>({});
  const addItem = useCartStore(state => state.addItem);
  const { user } = useAuth();
  const navigate = useNavigate();
  const supabase = getSupabase();

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
      
    // Check if in wishlist
    if (user && slug && supabase) {
       const checkWishlist = async () => {
         try {
           const { data, error } = await supabase
             .from('wishlists')
             .select('id')
             .eq('profile_id', user.id)
             .eq('product_id', product?.id);
             
           if (error) throw error;
           if (data && data.length > 0) {
             setIsInWishlist(true);
             setWishlistDocId(data[0].id);
           } else {
             setIsInWishlist(false);
             setWishlistDocId(null);
           }
         } catch (e) {
           console.error("Wishlist check error:", e);
         }
       };
       if (product?.id) checkWishlist();
    }
    
    return () => controller.abort();
  }, [user, slug, product?.id]);

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
        if (typeof data.variations === 'string') {
          try {
            data.variations = JSON.parse(data.variations);
          } catch (e) {
            data.variations = [];
          }
        }
        if (!Array.isArray(data.variations)) {
           data.variations = [];
        }
        setProduct(data);
        const mainImage = data.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=800`;
        setSelectedImage(mainImage);
        setSelectedMedia({type: 'image', url: mainImage, alt_text: data.main_image_alt || data.name});
        
        // Increment view count
        fetch(`/api/products/${data.id}/view`, { method: 'POST', signal }).catch(() => {});

        // Fetch related
        fetch(`/api/products?category=${data.category_id}`, { signal })
          .then(res => res.json())
          .then(related => {
            if (Array.isArray(related)) {
              setRelatedProducts(related.filter((p: ProductType) => p.id !== data.id).slice(0, 10));
            }
          })
          .catch(err => {
            if (err.name !== 'AbortError' && !err.message?.includes('aborted')) console.error(err);
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
            if (err.name !== 'AbortError' && !err.message?.includes('aborted')) console.error(err);
          });
      })
      .catch(err => {
        if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
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
      const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('zorando.com');
      
      try {
        // Use window.fbq directly to ensure eventID is passed correctly (ReactPixel wrapper sometimes drops the 3rd argument)
        if (isProduction && typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: product.name,
            content_ids: [product.sku ? product.sku.toString() : product.id.toString()],
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
            content_ids: [product.sku ? product.sku.toString() : product.id.toString()],
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Oups !</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-md">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "Est-ce qu'il y a une garantie ?",
      a: "Oui, tous nos produits sont testés avant l'envoi et couverts par une garantie contre les défauts de fabrication. Vous achetez en toute tranquillité."
    },
    {
      q: "Puis-je retourner le produit ?",
      a: "Absolument. Si le produit ne correspond pas à la description ou présente un défaut, vous pouvez le retourner ou l'échanger facilement."
    },
    {
      q: "C'est un produit original ?",
      a: "Oui, nous garantissons l'authenticité de tous nos articles. Vous recevrez le produit exact présenté sur nos photos et vidéos."
    },
    {
      q: "Mes informations personnelles sont-elles en sécurité ?",
      a: "Totalement. Vos données servent uniquement à la livraison et ne sont jamais partagées. De plus, vous ne payez qu'à la réception de votre commande (main à main)."
    }
  ];

  if (product?.faq_q1 && product?.faq_a1) {
    faqItems.push({ q: product.faq_q1, a: product.faq_a1 });
  }
  if (product?.faq_q2 && product?.faq_a2) {
    faqItems.push({ q: product.faq_q2, a: product.faq_a2 });
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
  const activePriceForDisplay = selectedVariation?.price || currentPrice;
  const hasVariationPrice = !!selectedVariation?.price;

  const handleAddToCart = () => {
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      toast.error("Veuillez sélectionner une option disponible (couleur, taille...) avant de continuer.");
      setShowOptionsHighlight(true);
      setTimeout(() => setShowOptionsHighlight(false), 3000);
      optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addItem(product, quantity, selectedVariation);
    
    // Use price from variation if available
    const activePrice = selectedVariation?.price || currentPrice;
    const safeValue = isNaN(activePrice * quantity) || (activePrice * quantity) <= 0 ? 1 : Number(Number(activePrice * quantity).toFixed(2));

    // Track Add to Cart
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag("event", "add_to_cart", {
          currency: "DZD",
          value: safeValue,
          items: [{
            item_id: product.id.toString(),
            item_name: product.name,
            price: activePrice,
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
        const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('zorando.com');
        
        if (isProduction && typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'AddToCart', {
            content_name: product.name,
            content_ids: [product.sku ? product.sku.toString() : product.id.toString()],
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
            content_ids: [product.sku ? product.sku.toString() : product.id.toString()],
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
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      toast.error("Veuillez sélectionner une option disponible (couleur, taille...) avant de commander.");
      setShowOptionsHighlight(true);
      setTimeout(() => setShowOptionsHighlight(false), 3000);
      optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    navigate('/checkout', { state: { directBuyItem: { ...product, quantity, selectedVariation, cartItemId: `${product.id}` + (selectedVariation ? `-${selectedVariation.id}` : '') } } });
  };

  const toggleWishlist = async () => {
    if (!user || !supabase) {
      toast.error("Veuillez vous connecter pour ajouter des favoris");
      navigate('/account/login');
      return;
    }

    try {
      if (isInWishlist && wishlistDocId) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('id', wishlistDocId);
          
        if (error) throw error;
        setIsInWishlist(false);
        setWishlistDocId(null);
        toast.success("Retiré des favoris");
      } else {
        const { data, error } = await supabase
          .from('wishlists')
          .insert([
            {
              profile_id: user.id,
              product_id: product.id
            }
          ])
          .select('id')
          .single();
          
        if (error) throw error;
        setIsInWishlist(true);
        setWishlistDocId(data.id);
        toast.success("Ajouté aux favoris !");
      }
    } catch (e) {
      console.error("Wishlist error:", e);
      toast.error("Une erreur est survenue");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.comment) return;
    
    setIsSubmittingReview(true);
    let imageUrl = null;

    try {
      if (reviewImage) {
        const formData = new FormData();
        formData.append('image', reviewImage);
        const uploadRes = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          console.error('Image upload failed');
        }
      }

      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: reviewForm.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          image_url: imageUrl
        })
      });
      if (res.ok) {
        setReviewForm({ name: '', rating: 5, comment: '' });
        setReviewImage(null);
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
    "sku": product.sku ? product.sku.toString() : product.id.toString(),
    "mpn": product.sku ? product.sku.toString() : product.id.toString(),
    "category": product.category_name || "General",
    "brand": {
      "@type": "Brand",
      "name": product.brand_name || "ZORANDO"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "DZD",
      "price": currentPrice,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
    },
    ...(reviews.length > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": Number(avgRating),
        "reviewCount": reviews.length,
        "bestRating": 5,
        "worstRating": 1
      }
    } : {})
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <SEO 
        title={product.seo_title || product.name || 'Produit'} 
        description={product.seo_description || (product.description ? product.description.substring(0, 150) + '...' : 'Achetez ce produit au meilleur prix.')} 
        image={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`}
        url={window.location.href}
        type="product"
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
              {selectedMedia.type === 'video' ? (
                <iframe
                  src={selectedMedia.url}
                  title="Product Video"
                  className="w-full h-full rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              ) : (
                <>
                  <img 
                    src={selectedMedia.url} 
                    alt={selectedMedia.alt_text || product.main_image_alt || product.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    loading="eager"
                  />
                  {product.video_url && (() => {
                    let videoId = '';
                    try {
                      const match = product.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                      if (match && match[1]) {
                        videoId = match[1];
                      }
                    } catch (e) {}
                    
                    if (!videoId) return null;
                    
                    const isShort = product.video_url.includes('youtube.com/shorts/');
                    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`;
                    
                    return (
                      <div 
                        className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 ${isShort ? 'w-[30%] max-w-[140px] md:w-[25%] md:max-w-[240px]' : 'w-[40%] max-w-[200px] md:w-[40%] md:max-w-[380px]'} ${isShort ? 'aspect-[9/16]' : 'aspect-video'} rounded-xl overflow-hidden shadow-2xl border-2 md:border-4 border-white cursor-pointer z-20 group transition-transform hover:scale-[1.02] bg-gray-900`}
                        onClick={() => setSelectedMedia({type: 'video', url: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`})}
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt="Video Preview"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                          <div className="w-10 h-10 md:w-14 md:h-14 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <Play size={20} className="text-orange-600 fill-orange-600 ml-1 md:w-6 md:h-6" />
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] md:text-xs text-white font-medium flex items-center gap-1">
                            <Youtube size={12} className="text-red-500" />
                            <span>Regarder la vidéo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {(product.images?.length > 0 || product.video_url) && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                  onClick={() => setSelectedMedia({type: 'image', url: product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`, alt_text: product.main_image_alt || product.name})}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-white p-1 ${selectedMedia.url === (product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`) ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`} alt={product.main_image_alt || product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
                {product.images?.map((img: any) => (
                  <button 
                    key={img.id}
                    onClick={() => setSelectedMedia({type: 'image', url: img.image, alt_text: img.alt_text})}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-white p-1 ${selectedMedia.url === img.image ? 'border-orange-500' : 'border-transparent'}`}
                  >
                    <img src={img.image} alt={img.alt_text || "Vue supplémentaire"} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
                {product.video_url && (() => {
                  const match = product.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                  const videoId = match ? match[1] : null;
                  if (!videoId) return null;
                  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                  const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`;
                  return (
                    <button 
                      onClick={() => setSelectedMedia({type: 'video', url: videoUrl})}
                      className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors bg-gray-900 border-2 relative ${selectedMedia.type === 'video' ? 'border-orange-500' : 'border-transparent'}`}
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                        alt="Video Thumbnail" 
                        className="w-full h-full object-cover opacity-60" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={16} className="text-white fill-white" />
                      </div>
                    </button>
                  );
                })()}
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
              <span 
                className="text-sm text-orange-500 hover:underline cursor-pointer"
                onClick={() => {
                  const element = document.getElementById('read-reviews-section');
                  if (element) {
                    const headerOffset = 180;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                         top: offsetPosition,
                         behavior: "smooth"
                    });
                  }
                }}
              >({reviews.length} avis vérifiés)</span>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
              {hasVariationPrice ? (
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-orange-600">{formatPrice(activePriceForDisplay)}</span>
                </div>
              ) : isPromo ? (
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

            {product.weight && Number(product.weight) > 0 && (
              <div className="mb-6">
                <span className="font-medium text-gray-700 mr-2">Poids:</span>
                <span className="text-gray-900 font-bold">{product.weight} kg</span>
              </div>
            )}

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
              {product.variations && product.variations.length > 0 && (
                <div 
                  className={`mb-4 p-3 rounded-lg border-2 transition-all duration-500 ${showOptionsHighlight ? 'border-red-500 bg-red-50/50 shadow-md ring-4 ring-red-500/20' : 'border-transparent'}`}
                  ref={optionsRef}
                >
                  <h4 className={`text-base font-bold mb-3 ${showOptionsHighlight ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                    Options disponibles {showOptionsHighlight && <span className="font-bold bg-red-100 px-2 py-1 rounded ml-2 text-xs uppercase tracking-wider block sm:inline-block mt-2 sm:mt-0">— Vous devez choisir une option !</span>}
                  </h4>
                  <div className={`flex flex-wrap gap-3 ${showOptionsHighlight ? 'p-3 rounded-xl border-2 border-red-500 bg-red-50/30' : ''}`}>
                    {product.variations.map((variation: any, idx: number) => {
                      const isSelected = selectedVariation?.id === variation.id;
                      const isColorAttribute = variation.attribute?.toLowerCase().includes('couleur') || variation.attribute?.toLowerCase().includes('color');
                      const colorHex = isColorAttribute ? (COLOR_MAP[variation.value.toLowerCase().trim()] || variation.value) : null;
                      
                      return (
                        <button
                          key={variation.id || idx}
                          onClick={() => {
                            setSelectedVariation(variation);
                            setShowOptionsHighlight(false);
                            if (variation.image) {
                              const img = variation.image.startsWith('http') || variation.image.startsWith('/api') ? variation.image : '/api/images/' + variation.image;
                              setSelectedImage(img);
                              setSelectedMedia({type: 'image', url: img});
                            }
                          }}
                          className={`
                            px-4 py-3 rounded-xl border text-sm flex flex-row items-center gap-3 transition-all
                            ${isSelected 
                              ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-500/50 shadow-md scale-[1.02]' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none'
                            }
                            ${variation.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                          `}
                          disabled={variation.stock === 0}
                        >
                          {isColorAttribute && colorHex && (
                            <span 
                              className={`w-8 h-8 rounded-full border shadow-inner flex-shrink-0 ${colorHex.toLowerCase() === '#ffffff' ? 'border-gray-300' : 'border-black/20'}`}
                              style={{ backgroundColor: colorHex }}
                            ></span>
                          )}
                          <div className="flex flex-col text-left justify-center">
                            <span className="font-medium text-[11px] uppercase tracking-wider text-gray-500 mb-1">{variation.attribute}</span>
                            <span className="font-extrabold text-base leading-none">{variation.value}</span>
                          </div>
                          {variation.price ? (
                            <span className={`text-sm pl-3 ml-2 border-l-2 font-black ${isSelected ? 'text-orange-700 border-orange-200' : 'text-gray-500 border-gray-200'}`}>
                              {variation.price} DA
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

            <div className="mt-auto flex flex-col gap-4">
              {/* Quantity Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantité :</span>
                <div className="flex items-center border border-gray-300 rounded-md bg-white h-[42px] w-32 shrink-0">
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
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a 
                  href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
                  className="flex items-center justify-center w-[54px] h-[54px] rounded-md border-2 border-orange-500 text-orange-500 hover:bg-orange-50 shrink-0 transition-colors"
                >
                  <Phone size={24} />
                </a>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center w-[54px] h-[54px] rounded-md bg-orange-500 text-white shrink-0 hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ShoppingCart size={24} />
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`flex items-center justify-center w-[54px] h-[54px] rounded-md border-2 shrink-0 transition-all ${
                    isInWishlist 
                      ? 'bg-red-50 border-red-500 text-red-500' 
                      : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-300'
                  }`}
                >
                  <Heart size={24} fill={isInWishlist ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-orange-500 text-white h-[54px] rounded-md font-bold text-lg flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                  J'achète
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-200">
              <tbody>
                {(typeof product.features === 'string' 
                    ? product.features.split('\n').filter(line => line.trim().includes(':')).map(line => {
                        const parts = line.split(':');
                        return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
                      })
                    : Array.isArray(product.features) ? product.features : []
                ).map((feature: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 border border-gray-200 font-medium text-gray-700 w-1/3 bg-gray-100">{feature.key}</td>
                    <td className="py-3 px-4 border border-gray-200 text-gray-600">{feature.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <HelpCircle className="text-orange-500" size={24} />
          Questions Fréquentes
        </h2>
        <div className="space-y-4">
          {faqItems.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-bold text-gray-800">{faq.q}</span>
                <ChevronDown 
                  className={`text-gray-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                  size={20} 
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" className="bg-white rounded-lg shadow-sm p-6 mb-12">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optionnel)</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-md hover:border-orange-500 hover:bg-orange-50 transition-colors">
                    <Camera size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Ajouter une photo</span>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('La taille de l\'image ne doit pas dépasser 5MB');
                            return;
                          }
                          setReviewImage(file);
                        }
                      }}
                    />
                  </label>
                  {reviewImage && (
                    <div className="mt-2 relative inline-block">
                      <img src={URL.createObjectURL(reviewImage)} alt="Preview" className="w-20 h-20 object-cover rounded-md border" />
                      <button 
                        type="button" 
                        onClick={() => setReviewImage(null)} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
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
          
          <div id="read-reviews-section" className="w-full md:w-2/3 space-y-4">
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
                  <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                  {review.image_url && (
                    <img 
                      src={review.image_url} 
                      alt="Photo de l'avis" 
                      className="w-24 h-24 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setModalImage(review.image_url)}
                    />
                  )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Mobile Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 md:hidden flex items-center gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a 
          href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
          className="flex items-center justify-center w-[54px] h-[54px] rounded-md border-2 border-orange-500 text-orange-500 hover:bg-orange-50 shrink-0 transition-colors"
        >
          <Phone size={24} />
        </a>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex items-center justify-center w-[54px] h-[54px] rounded-md bg-orange-500 text-white shrink-0 hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <ShoppingCart size={24} />
        </button>
        <button
          onClick={handleBuyNow}
          disabled={product.stock === 0}
          className="flex-1 bg-orange-500 text-white h-[54px] rounded-md font-bold text-lg flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          J'achète
        </button>
      </div>
      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setModalImage(null)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setModalImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={modalImage} 
            alt="Image en plein écran" 
            className="max-w-full max-h-[90vh] object-contain rounded-md" 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
