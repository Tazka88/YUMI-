import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ThumbsUp, Facebook, Instagram, MessageCircle, CreditCard, ArrowDown, Phone, Play, Youtube, ChevronDown, ChevronUp, ChevronRight, HelpCircle, Camera, X, Heart, CheckCircle2, PhoneCall, Sparkles, ZoomIn, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { useCartStore, Product as ProductType } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuth } from '../lib/AuthContext';
import { getSupabase } from '../lib/supabase';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO, { getCanonicalUrl } from '../components/SEO';
import { buildProductSchema, buildBreadcrumbSchema, smartTruncate } from '../lib/schemaUtils';
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

  const getInitialProduct = () => {
    if (typeof window !== 'undefined') {
      const init = (window as any).__INITIAL_PRODUCT__;
      if (init && (init.slug === slug || String(init.id) === slug)) {
        return init;
      }
      try {
        const el = document.getElementById('__INITIAL_PRODUCT__');
        if (el && el.textContent) {
          const parsed = JSON.parse(el.textContent);
          if (parsed && (parsed.slug === slug || String(parsed.id) === slug)) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return null;
  };

  const initialProduct = getInitialProduct();
  const [product, setProduct] = useState<any>(initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>(() => {
    if (initialProduct?.image) return initialProduct.image;
    return '';
  });
  const [selectedMedia, setSelectedMedia] = useState<{type: 'image' | 'video', url: string, alt_text?: string}>(() => {
    if (initialProduct?.image) {
      return { type: 'image', url: initialProduct.image, alt_text: initialProduct.main_image_alt || initialProduct.name };
    }
    return { type: 'image', url: '', alt_text: '' };
  });
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [reviews, setReviews] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const initReviews = (window as any).__INITIAL_REVIEWS__;
      if (Array.isArray(initReviews) && initReviews.length > 0) {
        return initReviews;
      }
    }
    return [];
  });
  const [quantity, setQuantity] = useState(1);
  const optionsRef = useRef<HTMLDivElement>(null);
  const relatedSectionRef = useRef<HTMLDivElement>(null);
  const [hasRelatedIntersected, setHasRelatedIntersected] = useState(false);
  const [showOptionsHighlight, setShowOptionsHighlight] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const isFavoriteInStore = useWishlistStore((state) => product ? state.isFavorite(product.id) : false);
  const toggleFavoriteInStore = useWishlistStore((state) => state.toggleFavorite);
  const isInWishlist = isFavoriteInStore;
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });
  const [settings, setSettings] = useState<any>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'faq' | 'reviews'>('description');
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { user } = useAuth();
  const navigate = useNavigate();
  const supabase = getSupabase();

  useEffect(() => {
    // Clean up initial SSR payload from window after hydration
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        (window as any).__INITIAL_PRODUCT__ = null;
        (window as any).__INITIAL_REVIEWS__ = null;
      }, 500);
    }
  }, []);

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
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Check if product is already set for this slug (from SSR or previous fetch)
    const hasCurrentProduct = Boolean(product && (product.slug === slug || String(product.id) === slug));
    if (!hasCurrentProduct) {
      const init = getInitialProduct();
      if (init) {
        setProduct(init);
        if (typeof window !== 'undefined') {
          (window as any).__CURRENT_PRODUCT__ = {
            id: Number(init.id),
            productId: Number(init.id),
            name: init.name,
            productName: init.name,
            url: `/product/${init.slug || slug}`,
            productUrl: `/product/${init.slug || slug}`,
            image: init.image || '',
            productImage: init.image || '',
            price: init.price,
            stock: init.stock
          };
        }
        const mainImg = init.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(init.name)}&background=random&size=800`;
        setSelectedImage(mainImg);
        setSelectedMedia({ type: 'image', url: mainImg, alt_text: init.main_image_alt || init.name });
      } else {
        setProduct(null);
      }
    }

    setError(null);
    fetch(`/api/products/${slug}`, { signal, priority: 'high', cache: 'no-store' } as any)
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
        if (typeof window !== 'undefined') {
          (window as any).__CURRENT_PRODUCT__ = {
            id: Number(data.id),
            productId: Number(data.id),
            name: data.name,
            productName: data.name,
            url: `/product/${data.slug}`,
            productUrl: `/product/${data.slug}`,
            image: data.image || '',
            productImage: data.image || '',
            price: data.price,
            stock: data.stock
          };
          window.dispatchEvent(new CustomEvent('product-page-active', {
            detail: {
              productId: Number(data.id),
              productName: data.name,
              productUrl: `/product/${data.slug}`,
              productImage: data.image || '',
              price: data.price,
              stock: data.stock
            }
          }));
        }
        const mainImage = data.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=800`;
        setSelectedImage(prev => prev || mainImage);
        setSelectedMedia(prev => prev.url ? prev : {type: 'image', url: mainImage, alt_text: data.main_image_alt || data.name});
        
        // Increment view count
        fetch(`/api/products/${data.id}/view`, { method: 'POST', signal }).catch(() => {});

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
          if (!hasCurrentProduct) {
            setError(err.message);
          }
        }
      });
      
      return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasRelatedIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' } // trigger when within 400px of viewport
    );
    if (relatedSectionRef.current) {
      observer.observe(relatedSectionRef.current);
    }
    return () => observer.disconnect();
  }, [product?.id]);

  useEffect(() => {
    if (!hasRelatedIntersected || !product?.category_id) return;
    
    const controller = new AbortController();
    fetch(`/api/products?category=${product.category_id}`, { signal: controller.signal })
      .then(res => res.json())
      .then(related => {
        if (Array.isArray(related)) {
          setRelatedProducts(related.filter((p: ProductType) => p.id !== product.id).slice(0, 10));
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError' && !err.message?.includes('aborted')) console.error(err);
      });
      
    return () => controller.abort();
  }, [hasRelatedIntersected, product?.category_id, product?.id]);

  const viewContentTrackedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (product && viewContentTrackedRef.current !== product.id.toString()) {
      viewContentTrackedRef.current = product.id.toString();
      const eventId = generateEventId();
      const isPromoValid = (() => {
        if (product.promo_price === null || product.promo_price === undefined) return false;
        const now = new Date();
        if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
        if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
        return true;
      })();
      const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
      const safeValue = isNaN(currentPrice) || currentPrice <= 0 ? 1 : Number(currentPrice.toFixed(2));
      
      // GA4 view_item event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag("event", "view_item", {
            currency: "DZD",
            value: safeValue,
            items: [{
              item_id: product.id.toString(),
              item_name: product.name,
              price: currentPrice,
              quantity: 1,
              item_category: product.category_name || undefined
            }]
          });
        } catch (e) {
          console.error('Failed to send GA view_item event', e);
        }
      }

      if (trackingIds.fb) {
        try {
          // Use window.fbq directly to ensure eventID is passed correctly (ReactPixel wrapper sometimes drops the 3rd argument)
          if (typeof window !== 'undefined' && (window as any).fbq) {
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
    }
  }, [product?.id, trackingIds.fb]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="Oups !" description={error} noindex={true} />
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

  const isPromo = (() => {
    if (product.promo_price === null) return false;
    const now = new Date();
    if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) return false;
    if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) return false;
    return true;
  })();
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
            quantity: quantity,
            item_category: product.category_name || undefined
          }]
        });
      } catch (e) {
        console.error('Failed to send GA add_to_cart event', e);
      }
    }
    
    if (trackingIds.fb) {
      try {
        const eventId = generateEventId();
        
        if (typeof window !== 'undefined' && (window as any).fbq) {
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
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      toast.error("Veuillez sélectionner une option disponible (couleur, taille...) avant de commander.");
      setShowOptionsHighlight(true);
      setTimeout(() => setShowOptionsHighlight(false), 3000);
      optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    navigate('/checkout', { state: { directBuyItem: { ...product, quantity, selectedVariation, cartItemId: `${product.id}` + (selectedVariation ? `-${selectedVariation.id}` : '') } } });
  };

  const handleOpenProductChat = () => {
    if (!product) return;
    const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${product.slug}` : `/product/${product.slug}`;
    const mainImage = (product.image && product.image.startsWith('/')) 
      ? `https://www.zorando.com${product.image}` 
      : (product.image || (product.images && product.images[0]) || '');

    window.dispatchEvent(new CustomEvent('open-product-chat', {
      detail: {
        productId: product.id,
        productName: product.name,
        productUrl: canonicalUrl,
        productImage: mainImage,
        price: product.price,
        stock: product.stock
      }
    }));
  };

  const toggleWishlist = async () => {
    if (!product) return;
    await toggleFavoriteInStore(product, user);
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

  const cleanUrl = getCanonicalUrl();

  const productSchema = buildProductSchema(product, reviews, cleanUrl, 'https://www.zorando.com');

  const breadcrumbItems = [
    { name: 'Accueil', item: 'https://www.zorando.com/' }
  ];
  let position = 2;
  if (product.category_slug) {
    breadcrumbItems.push({ name: product.category_name || 'Catégorie', item: `https://www.zorando.com/category/${product.category_slug}` });
  }
  if (product.subcategory_slug) {
    breadcrumbItems.push({ name: product.subcategory_name || 'Sous-catégorie', item: `https://www.zorando.com/category/${product.subcategory_slug}?sub=true` });
  }
  if (product.sub_subcategory_slug) {
    breadcrumbItems.push({ name: product.sub_sub_category_name || product.sub_subcategory_name || 'Sous-sous-catégorie', item: `https://www.zorando.com/category/${product.sub_subcategory_slug}?subsub=true` });
  }
  if (product.sub_sub_subcategory_slug) {
    breadcrumbItems.push({ name: product.sub_sub_subcategory_name || 'Catégorie spécialisée', item: `https://www.zorando.com/category/${product.sub_sub_subcategory_slug}?level4=true` });
  }
  breadcrumbItems.push({ name: product.name, item: cleanUrl });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  // finalSchema is removed to avoid duplicating the schema rendered by the SSR

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <SEO 
        title={product.seo_title || product.name || 'Produit'} 
        description={product.seo_description || (product.description ? smartTruncate(product.description.replace(/<[^>]+>/g, ' '), 155) : 'Achetez ce produit au meilleur prix.')} 
        keywords={product.seo_keywords}
        image={(product.image && product.image.startsWith('/')) ? `https://www.zorando.com${product.image}` : (product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`)}
        url={cleanUrl}
        type="product"
      />
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <Link to={`/category/${product.category_slug || product.category_id}`} className="hover:text-orange-500">{product.category_name || 'Catégorie'}</Link>
        {product.subcategory_name && (
          <>
            <span>/</span>
            <Link to={`/category/${product.subcategory_slug || product.subcategory_id}?sub=true`} className="hover:text-orange-500">{product.subcategory_name}</Link>
          </>
        )}
        {product.sub_subcategory_name && (
          <>
            <span>/</span>
            <Link to={`/category/${product.sub_subcategory_slug || product.sub_subcategory_id}?subsub=true`} className="hover:text-orange-500">{product.sub_subcategory_name}</Link>
          </>
        )}
        {product.sub_sub_subcategory_name && (
          <>
            <span>/</span>
            <Link to={`/category/${product.sub_sub_subcategory_slug || product.sub_sub_subcategory_id}?level4=true`} className="hover:text-orange-500">{product.sub_sub_subcategory_name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] border border-gray-100/90 overflow-hidden mb-10 sm:mb-12">
        <div className="flex flex-col lg:flex-row">
          
          {/* A. GALERIE PHOTOS */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 lg:border-r border-gray-100 flex flex-col gap-4">
            {/* Main Image with Interactive Desktop Zoom */}
            <div 
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-gray-100/80 flex items-center justify-center p-3 sm:p-6 group select-none shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-crosshair"
              onMouseMove={(e) => {
                if (selectedMedia.type === 'image') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                  setZoomPos({ x, y });
                  setIsZooming(true);
                }
              }}
              onMouseLeave={() => {
                setZoomPos(null);
                setIsZooming(false);
              }}
              onClick={() => {
                if (selectedMedia.type === 'image' && selectedMedia.url) {
                  setModalImage(selectedMedia.url);
                }
              }}
            >
              {/* Promo Discount Badge */}
              {isPromo && (
                <div className="absolute top-4 left-4 z-20 bg-[#FF6B00] text-white text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl shadow-md">
                  -{discount}%
                </div>
              )}

              {/* Fullscreen / Zoom hint badge */}
              {selectedMedia.type === 'image' && (
                <div className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-gray-600 border border-gray-200/80 flex items-center justify-center shadow-xs opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  <ZoomIn size={15} />
                </div>
              )}

              {/* Media Content */}
              {selectedMedia.type === 'video' ? (
                <iframe
                  src={selectedMedia.url}
                  title="Product Video"
                  className="w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              ) : (
                <>
                  <img 
                    src={selectedMedia.url} 
                    alt={selectedMedia.alt_text || product.main_image_alt || product.name}
                    className="w-full h-full object-contain transition-transform"
                    style={{
                      transformOrigin: zoomPos ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                      transform: isZooming && zoomPos ? 'scale(1.85)' : 'scale(1)',
                      transition: isZooming ? 'none' : 'transform 0.3s ease-out'
                    }}
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    loading="eager"
                  />

                  {/* Video Floating Action Preview */}
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
                    const currentOrigin = 'https://www.zorando.com';
                    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`;
                    
                    return (
                      <div 
                        className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 ${isShort ? 'w-[28%] max-w-[120px] sm:max-w-[160px]' : 'w-[38%] max-w-[170px] sm:max-w-[220px]'} ${isShort ? 'aspect-[9/16]' : 'aspect-video'} rounded-xl overflow-hidden shadow-xl border-2 border-white cursor-pointer z-20 group/vid transition-transform hover:scale-105 bg-gray-900`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedia({type: 'video', url: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`});
                        }}
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                          alt="Vidéo de présentation"
                          className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/vid:bg-black/10 transition-colors">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/95 rounded-full flex items-center justify-center shadow-md group-hover/vid:scale-110 transition-transform">
                            <Play size={16} className="text-[#FF6B00] fill-[#FF6B00] ml-0.5" />
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white font-bold flex items-center gap-1">
                            <Youtube size={10} className="text-red-500" />
                            <span>Vidéo</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Thumbnails Row */}
            {(product.images?.length > 0 || product.video_url) && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 pt-1 hide-scrollbar">
                {/* Main image thumbnail */}
                <button 
                  type="button"
                  onClick={() => setSelectedMedia({type: 'image', url: product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`, alt_text: product.main_image_alt || product.name})}
                  className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-white p-1 ${
                    selectedMedia.url === (product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`) 
                      ? 'border-[#FF6B00] shadow-sm scale-105' 
                      : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=800`} alt={product.main_image_alt || product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>

                {/* Additional images */}
                {product.images?.map((img: any) => (
                  <button 
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedMedia({type: 'image', url: img.image, alt_text: img.alt_text})}
                    className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-white p-1 ${
                      selectedMedia.url === img.image 
                        ? 'border-[#FF6B00] shadow-sm scale-105' 
                        : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image} alt={img.alt_text || "Vue supplémentaire"} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}

                {/* Video thumbnail */}
                {product.video_url && (() => {
                  const match = product.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                  const videoId = match ? match[1] : null;
                  if (!videoId) return null;
                  const currentOrigin = 'https://www.zorando.com';
                  const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1${currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''}`;
                  return (
                    <button 
                      type="button"
                      onClick={() => setSelectedMedia({type: 'video', url: videoUrl})}
                      className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-gray-900 relative ${
                        selectedMedia.type === 'video' 
                          ? 'border-[#FF6B00] shadow-sm scale-105' 
                          : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                        alt="Miniature Vidéo" 
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

          {/* B. BLOC INFORMATIONS ET ACHAT */}
          <div className="w-full lg:w-1/2 p-5 sm:p-7 lg:p-9 flex flex-col justify-between">
            <div>
              {/* 1. Marque du produit */}
              {product.brand_name && (
                <div className="mb-2">
                  {product.brand_slug ? (
                    <Link 
                      to={`/brands/${product.brand_slug}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#FF6B00] bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full border border-orange-200/70 transition-colors group"
                    >
                      <span>{product.brand_name}</span>
                      <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Marque : {product.brand_name}
                    </span>
                  )}
                </div>
              )}

              {/* 2. Nom du produit */}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug mb-3">
                {product.name}
              </h1>

              {/* 3. Note et nombre d'avis réels */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} fill={star <= Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={16} />
                  ))}
                </div>
                <span className="text-sm font-extrabold text-gray-900">{avgRating}</span>
                <span className="text-gray-300">•</span>
                <button 
                  type="button"
                  onClick={() => {
                    setActiveTab('reviews');
                    document.getElementById('details-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#FF6B00] transition-colors underline decoration-dotted"
                >
                  {reviews.length > 0 ? `${reviews.length} avis vérifiés` : 'Donner le premier avis'}
                </button>

                {/* Wishlist toggle */}
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    className={`p-2.5 rounded-full border transition-all ${
                      isInWishlist 
                        ? 'bg-red-50 border-red-200 text-red-500 shadow-xs' 
                        : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                    }`}
                    title={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              {/* 4, 5, 6. Prix actuel très visible, ancien prix barré et badge de réduction */}
              <div className="bg-gradient-to-br from-gray-50/90 to-orange-50/30 rounded-2xl p-4 sm:p-5 mb-6 border border-gray-100 shadow-2xs">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {hasVariationPrice ? (
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Prix de l'option choisie</span>
                      <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] tracking-tight">{formatPrice(activePriceForDisplay)}</span>
                    </div>
                  ) : isPromo ? (
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] tracking-tight">
                        {formatPrice(product.promo_price)}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-400 line-through font-medium">
                        {formatPrice(product.price)}
                      </span>
                      <span className="inline-flex items-center text-xs sm:text-sm font-black text-white bg-[#FF6B00] px-2.5 py-1 rounded-lg shadow-xs">
                        -{discount}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Prix</span>
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{formatPrice(product.price)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Points forts du produit */}
              {product.key_points && Array.isArray(product.key_points) && product.key_points.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#FF6B00]" />
                    <span>Points forts de cet article</span>
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {product.key_points.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-[#FF6B00] shrink-0 mt-0.5" />
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 8. Disponibilité réelle du stock & Poids */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {product.stock > 0 ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>En stock ({product.stock} exemplaires disponibles)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Rupture de stock temporaire</span>
                  </div>
                )}
                {product.weight && Number(product.weight) > 0 && (
                  <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-medium">Poids : {product.weight} kg</span>
                )}
              </div>

              {/* Options / Variations (Couleur, Taille...) */}
              {product.variations && product.variations.length > 0 && (
                <div 
                  className={`mb-6 p-3.5 rounded-2xl border-2 transition-all duration-300 ${showOptionsHighlight ? 'border-red-500 bg-red-50/50 shadow-md ring-4 ring-red-500/20' : 'border-gray-100 bg-gray-50/40'}`}
                  ref={optionsRef}
                >
                  <h4 className={`text-sm font-extrabold mb-3 flex items-center justify-between ${showOptionsHighlight ? 'text-red-600' : 'text-gray-800'}`}>
                    <span>Options disponibles</span>
                    {showOptionsHighlight && <span className="text-xs text-red-600 font-bold">Veuillez choisir une option</span>}
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variations.map((variation: any, idx: number) => {
                      const isSelected = selectedVariation?.id === variation.id;
                      const isColorAttribute = variation.attribute?.toLowerCase().includes('couleur') || variation.attribute?.toLowerCase().includes('color');
                      const colorHex = isColorAttribute ? (COLOR_MAP[variation.value.toLowerCase().trim()] || variation.value) : null;
                      
                      return (
                        <button
                          key={variation.id || idx}
                          type="button"
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
                            px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all
                            ${isSelected 
                              ? 'border-[#FF6B00] bg-orange-50 text-orange-950 ring-2 ring-[#FF6B00]/30 shadow-xs font-bold' 
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                            ${variation.stock === 0 ? 'opacity-40 cursor-not-allowed bg-gray-100' : ''}
                          `}
                          disabled={variation.stock === 0}
                        >
                          {isColorAttribute && colorHex && (
                            <span 
                              className={`w-5 h-5 rounded-full border shadow-inner shrink-0 ${colorHex.toLowerCase() === '#ffffff' ? 'border-gray-300' : 'border-black/20'}`}
                              style={{ backgroundColor: colorHex }}
                            ></span>
                          )}
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] uppercase text-gray-500 font-medium leading-none mb-0.5">{variation.attribute}</span>
                            <span className="font-extrabold leading-tight">{variation.value}</span>
                          </div>
                          {variation.price ? (
                            <span className={`text-xs pl-2 ml-1 border-l font-black ${isSelected ? 'text-[#FF6B00] border-orange-200' : 'text-gray-500 border-gray-200'}`}>
                              {variation.price} DA
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 9, 10. Sélecteur de quantité & Boutons d'achat principaux */}
            {(() => {
              const maxAvailable = selectedVariation && typeof selectedVariation.stock === 'number' ? selectedVariation.stock : product.stock;
              return (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Quantity Row */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quantité :</span>
                    <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs h-10 w-28">
                      <button 
                        type="button"
                        className="w-9 h-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors flex items-center justify-center font-bold text-base"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >-</button>
                      <span className="flex-1 text-center font-black text-sm text-gray-900">{quantity}</span>
                      <button 
                        type="button"
                        className="w-9 h-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors flex items-center justify-center font-bold text-base"
                        onClick={() => setQuantity(Math.min(maxAvailable, quantity + 1))}
                        disabled={quantity >= maxAvailable || maxAvailable === 0}
                      >+</button>
                    </div>
                  </div>

                  {/* Boutons d'action : Ajouter au panier + Commander directement */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={maxAvailable === 0}
                      className="h-14 rounded-xl bg-[#FF6B00] hover:bg-orange-600 active:scale-[0.99] text-white font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                    >
                      <ShoppingCart size={20} className="transition-transform group-hover:scale-110" />
                      <span>Ajouter au panier</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={maxAvailable === 0}
                      className="h-14 rounded-xl bg-gray-900 hover:bg-black active:scale-[0.99] text-white font-black text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-gray-900/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Commander directement</span>
                    </button>
                  </div>

                  {/* Actions secondaires : Téléphone et Chat */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <a 
                      href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-700 hover:text-orange-600 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      <PhoneCall size={15} className="text-[#FF6B00]" />
                      <span>Commander par téléphone</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleOpenProductChat}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-700 hover:text-orange-600 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                    >
                      <MessageCircle size={15} className="text-[#FF6B00]" />
                      <span>Poser une question</span>
                    </button>
                  </div>

                  {/* C. RÉASSURANCE ET CONFIANCE (4 piliers élégants) */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                          <Truck size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-900 block leading-tight">Livraison 58 wilayas</span>
                          <span className="text-[11px] text-gray-500 leading-snug">Partout en Algérie à domicile ou en point relais</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-900 block leading-tight">Paiement à la livraison</span>
                          <span className="text-[11px] text-gray-500 leading-snug">Règlement en espèces à la réception de votre colis</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <RotateCcw size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-900 block leading-tight">Retour sous 7 jours</span>
                          <span className="text-[11px] text-gray-500 leading-snug">Échange garanti si non-conforme ou défectueux</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <PhoneCall size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-900 block leading-tight">Confirmation téléphonique</span>
                          <span className="text-[11px] text-gray-500 leading-snug">Validation par appel avant chaque expédition</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social share */}
                  <div className="flex items-center justify-between pt-3 text-xs text-gray-500">
                    <span className="font-medium">Partager ce produit :</span>
                    <div className="flex items-center gap-2">
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white hover:opacity-90 transition-opacity">
                        <Facebook size={13} />
                      </a>
                      <a href={`https://wa.me/?text=${encodeURIComponent(cleanUrl)}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 text-white hover:opacity-90 transition-opacity">
                        <MessageCircle size={13} />
                      </a>
                      <a href={`https://www.instagram.com/`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white hover:opacity-90 transition-opacity">
                        <Instagram size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* D. INFORMATIONS DÉTAILLÉES : NAVIGATION PAR ONGLETS */}
      {(() => {
        const hasFeatures = Boolean(
          product.features && (
            typeof product.features === 'string' 
              ? product.features.trim().length > 0 
              : Array.isArray(product.features) && product.features.length > 0
          )
        );

        const parsedFeatures: { key: string; value: string }[] = typeof product.features === 'string' 
          ? product.features.split('\n').filter((line: string) => line.trim().includes(':')).map((line: string) => {
              const parts = line.split(':');
              return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
            })
          : Array.isArray(product.features) ? product.features : [];

        return (
          <div id="details-section" className="bg-white rounded-3xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden mb-12 scroll-mt-24">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-8 border-b border-gray-100 overflow-x-auto hide-scrollbar bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`py-4 px-3 sm:px-5 font-black text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'description'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Description du produit
              </button>

              {hasFeatures && (
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`py-4 px-3 sm:px-5 font-black text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'specs'
                      ? 'border-[#FF6B00] text-[#FF6B00]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Caractéristiques techniques
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`py-4 px-3 sm:px-5 font-black text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'faq'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Questions Fréquentes ({faqItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-3 sm:px-5 font-black text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-[#FF6B00] text-[#FF6B00]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Avis clients ({reviews.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-8 lg:p-10">
              {/* Onglet 1 : Description */}
              {activeTab === 'description' && (
                <div className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  {product.description ? (
                    (() => {
                      const raw = product.description;
                      const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
                      const safeContent = DOMPurify.sanitize(
                        hasHtml ? raw : raw.replace(/\n/g, '<br />'),
                        {
                          ADD_ATTR: ['target', 'rel'],
                          ALLOWED_TAGS: [
                            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
                            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                            'ul', 'ol', 'li', 'span', 'div', 'blockquote',
                            'table', 'thead', 'tbody', 'tr', 'th', 'td',
                            'img', 'a', 'hr', 'code', 'pre'
                          ],
                          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style', 'width', 'height']
                        }
                      );

                      return (
                        <div
                          className="prose max-w-none text-gray-700 leading-relaxed text-sm sm:text-base prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-p:my-3 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-bold prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-img:rounded-xl prose-img:shadow-sm prose-img:max-h-96 prose-img:mx-auto prose-table:border-collapse prose-table:w-full prose-td:border prose-td:border-gray-200 prose-td:p-2 prose-th:border prose-th:border-gray-200 prose-th:p-2 prose-th:bg-gray-50 prose-a:text-[#FF6B00] hover:prose-a:underline"
                          dangerouslySetInnerHTML={{ __html: safeContent }}
                        />
                      );
                    })()
                  ) : (
                    <p className="text-gray-400 italic">Aucune description détaillée disponible pour ce produit.</p>
                  )}
                </div>
              )}

              {/* Onglet 2 : Caractéristiques techniques */}
              {activeTab === 'specs' && hasFeatures && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-gray-100 rounded-xl overflow-hidden">
                    <tbody>
                      {parsedFeatures.map((feature, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50/70' : 'bg-white'}>
                          <td className="py-3 px-4 border border-gray-100 font-extrabold text-xs sm:text-sm text-gray-800 w-1/3 bg-gray-100/70">
                            {feature.key}
                          </td>
                          <td className="py-3 px-4 border border-gray-100 text-xs sm:text-sm text-gray-700">
                            {feature.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Onglet 3 : Questions Fréquentes */}
              {activeTab === 'faq' && (
                <div className="space-y-3 max-w-3xl">
                  {faqItems.map((faq, index) => (
                    <div key={index} className="border border-gray-200/80 rounded-2xl overflow-hidden transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-gray-50/70 hover:bg-gray-100/80 transition-colors cursor-pointer"
                      >
                        <span className="font-extrabold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                        <ChevronDown 
                          className={`text-gray-500 shrink-0 ml-2 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                          size={18} 
                        />
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="p-4 sm:p-5 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Onglet 4 : Avis Clients (E. AVIS CLIENTS) */}
              {activeTab === 'reviews' && (
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                  {/* Left Column: Rating Score & Submit Form */}
                  <div className="w-full lg:w-5/12">
                    {/* Score summary */}
                    <div className="bg-gray-50/80 rounded-2xl p-6 text-center border border-gray-100 mb-6">
                      <div className="text-5xl font-black text-gray-900 mb-1">{avgRating}</div>
                      <div className="flex justify-center text-amber-400 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} fill={star <= Math.round(parseFloat(avgRating)) ? "currentColor" : "none"} size={20} />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Basé sur {reviews.length} avis réels vérifiés</p>
                    </div>

                    {/* Review Form */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                      <h3 className="font-black text-base text-gray-900 mb-4">Donner votre avis</h3>
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Votre nom *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex : Karim B."
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-hidden"
                            value={reviewForm.name}
                            onChange={e => setReviewForm({...reviewForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Note globale *</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star} 
                                type="button"
                                onClick={() => setReviewForm({...reviewForm, rating: star})}
                                className={`${reviewForm.rating >= star ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400 transition-colors cursor-pointer`}
                              >
                                <Star fill="currentColor" size={24} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Votre commentaire *</label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="Partagez votre expérience avec ce produit..."
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] outline-hidden resize-none"
                            value={reviewForm.comment}
                            onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Photo (Optionnel)</label>
                          <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#FF6B00] hover:bg-orange-50/30 transition-colors">
                            <Camera size={18} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-600">Ajouter une photo</span>
                            <input 
                              type="file" 
                              accept="image/jpeg, image/png, image/webp" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error('La taille de l\'image ne doit pas dépasser 5MB');
                                    return;
                                  }
                                  setReviewImage(file);
                                }
                              }}
                            />
                          </label>
                          {reviewImage && (
                            <div className="mt-2 relative inline-block">
                              <img src={URL.createObjectURL(reviewImage)} alt="Aperçu" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                              <button 
                                type="button" 
                                onClick={() => setReviewImage(null)} 
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-xs"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        <button 
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingReview ? 'Publication en cours...' : 'Envoyer mon avis'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Customer Reviews List */}
                  <div className="w-full lg:w-7/12 space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                        <Award size={36} className="text-orange-400 mx-auto mb-2 opacity-75" />
                        <h4 className="font-bold text-gray-800 text-base mb-1">Aucun avis pour le moment</h4>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">
                          Avez-vous testé ce produit ? Soyez le premier client à partager votre avis vérifié !
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div key={review.id} className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-gray-900 text-sm">{review.customer_name}</span>
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">Achat vérifié</span>
                              </div>
                              <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} fill={star <= review.rating ? "currentColor" : "none"} size={14} />
                              ))}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                            {review.image_url && (
                              <img 
                                src={review.image_url} 
                                alt="Photo de l'avis" 
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setModalImage(review.image_url)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* F. PRODUITS SIMILAIRES */}
      <div ref={relatedSectionRef}></div>
      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-2.5 h-6 bg-[#FF6B00] rounded-full"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Produits Similaires</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      )}

      {/* 4. EXPÉRIENCE MOBILE : STICKY MOBILE BOTTOM BAR */}
      {(() => {
        const maxAvailable = selectedVariation && typeof selectedVariation.stock === 'number' ? selectedVariation.stock : product.stock;
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-3.5 py-2.5 z-50 md:hidden flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img 
                src={selectedMedia.url || product.image} 
                alt={product.name} 
                className="w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-200/90 shrink-0 p-0.5" 
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-gray-900 truncate leading-tight">{product.name}</span>
                <span className="text-sm font-black text-[#FF6B00] leading-snug">{formatPrice(activePriceForDisplay)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a 
                href={`tel:${settings?.contact_phone?.replace(/\s/g, '') || ''}`}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-2xs"
                title="Appeler"
              >
                <PhoneCall size={16} className="text-[#FF6B00]" />
              </a>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={maxAvailable === 0}
                className="px-4 h-10 rounded-xl bg-[#FF6B00] hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
              >
                <ShoppingCart size={15} />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs" onClick={() => setModalImage(null)}>
          <button 
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <X size={28} />
          </button>
          <img 
            src={modalImage} 
            alt="Image en plein écran" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
