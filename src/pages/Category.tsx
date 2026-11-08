import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Filter, ChevronDown, ChevronUp, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { getCategoryWithEmoji, CategoryNameDisplay } from '../components/Layout';
import Slider from '../components/Slider';
import { fetchWithCache } from '../lib/utils';
import { categorySEOData } from '../utils/seoData';

const SUBCATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // Électroménager
  "petits-electromenagers": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop&q=80",
  "gros-electromenagers": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
  "chauffage-climatisation": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",

  // Téléphonie
  "telephone-portable": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1788299230867-rjf4nqr.webp",
  "accessoires-telephone": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1788299296497-stuu4c.webp",
  "telephones-fixes": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1788299197925-f6sjys.webp",

  // Mode & Vêtements
  "hommes": "https://images.unsplash.com/photo-1490578474895-699bc4e2cf59?w=800&auto=format&fit=crop&q=80",
  "femmes": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
  "enfant-et-bebe": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80",

  // Maison & Cuisine & Bureau
  "maison-cuisine": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
  "cuisine": "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80",
  "bureau-fournitures": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80",
  "bricolage-renovation": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80",
  "jardin-et-plein-air": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",

  // Informatique
  "accessoires-pc": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
  "composants-pc-informatique": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
  "reseaux-informatique": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80",

  // Sports & Loisirs
  "sport-fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
  "loisirs-plein-air": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80",
  "survetements-de-sport": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80",
  "camping-et-randonnee": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=80",

  // Beauté & Santé
  "beaute-soins-femme": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1791383213095-j5fuai.webp",
  "beaute-soins-homme": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1791382893185-1jpwdp.webp",
  "bien-etre-massage-relaxation": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1791383438335-f39b5s.webp",
  "sante-premiers-soins": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1791383705502-pzhu9.webp",
  "soins-bucco-dentaires": "https://evvbhalgyffagsesmvhu.supabase.co/storage/v1/object/public/images/uploads/1791383617701-qd5ad8.webp",
};

const SUBCATEGORY_SUBTITLES: Record<string, string> = {
  "petits-electromenagers": "Cafetières, Mixeurs & Air Fryers",
  "gros-electromenagers": "Réfrigérateurs, Fours & Lave-linge",
  "chauffage-climatisation": "Climatiseurs & Radiateurs",
  "telephone-portable": "Smartphones, iPhones & Android",
  "accessoires-telephone": "Écouteurs, Coques & Chargeurs",
  "telephones-fixes": "Téléphones sans fil & Bureautique",
  "hommes": "Costumes, Chemises & Streetwear",
  "femmes": "Robes, Chaussures & Sacs à main",
  "enfant-et-bebe": "Mode Bébé, Poussettes & Jouets",
  "maison-cuisine": "Salons, Décoration & Mobilier",
  "cuisine": "Poêles, Casseroles & Ustensiles Chef",
  "bureau-fournitures": "Bureaux, Chaises & Organisation",
  "bricolage-renovation": "Perceuses, Outillage & Bricolage",
  "jardin-et-plein-air": "Mobilier Extérieur & Outillage Jardin",
  "accessoires-pc": "Claviers Gamers, Souris & Tapis",
  "composants-pc-informatique": "Cartes Graphiques, RAM & Boîtiers",
  "reseaux-informatique": "Routeurs Wi-Fi 6 & Commutateurs",
  "sport-fitness": "Haltères, Tapis de Course & Muscu",
  "loisirs-plein-air": "Vélos, Trottinettes & Glisse",
  "survetements-de-sport": "Joggings, Vestes & Tenues Pro",
  "camping-et-randonnee": "Tentes, Sacs à dos & Bivouac",
  "beaute-soins-femme": "Soins du Visage, Parfums & Make-up",
  "beaute-soins-homme": "Tondeuses, Parfums & Soins Barbe",
  "bien-etre-massage-relaxation": "Appareils de Massage & Relaxation",
  "sante-premiers-soins": "Tensiomètres & Soins Quotidiens",
  "soins-bucco-dentaires": "Brosses à dents électriques & Soins"
};

const SubCategoryCard: React.FC<{
  item: any;
  parentName?: string;
  queryParam: 'sub' | 'subsub' | 'level4';
}> = ({ item, parentName, queryParam }) => {
  const cleanName = item.name.replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim();
  const subtitle = SUBCATEGORY_SUBTITLES[item.slug] || (parentName ? `Univers ${parentName}` : "Découvrez la sélection");

  const rawImage = item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('/api/'))
    ? item.image
    : (SUBCATEGORY_FALLBACK_IMAGES[item.slug] || item.image || '');

  const imageUrl = rawImage && rawImage.startsWith('/api/images/')
    ? `${rawImage}${rawImage.includes('?') ? '&' : '?'}w=800`
    : rawImage;

  return (
    <Link
      to={`/category/${item.slug}?${queryParam}=true`}
      className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-xl hover:border-[#FF6B00]/70 transition-all duration-300 block select-none bg-neutral-900 active:scale-[0.99] aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/11]"
    >
      {/* Background Image with lazy loading and object-cover */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={cleanName}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-orange-950 flex items-center justify-center">
          <Layers size={48} className="text-orange-500/30" />
        </div>
      )}

      {/* Atmospheric Contrast Dark Gradient Overlay (high performance, no backdrop filter) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:via-black/30 transition-colors duration-300 pointer-events-none" />

      {/* Top Floating Badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-[11px] font-bold text-orange-400 shadow-sm group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
          <Sparkles size={12} />
          <span>Rayon</span>
        </span>
      </div>

      {/* Bottom Content Area: Clear, bold typography and integrated subtle action arrow */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 flex items-end justify-between gap-3 pointer-events-none">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1 line-clamp-1 drop-shadow-xs">
            {subtitle}
          </span>
          <h3 className="font-black text-white text-lg sm:text-xl lg:text-2xl tracking-tight leading-snug group-hover:text-orange-200 transition-colors drop-shadow-md truncate">
            {cleanName}
          </h3>
        </div>

        {/* Integrated Discreet Arrow Action (replaces the bulky 30% bottom button) */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 group-hover:bg-[#FF6B00] text-white flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:translate-x-0.5 shadow-sm">
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
};

export default function Category() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('Tous les produits');
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  const [mobileCategoryImage, setMobileCategoryImage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentSubcategories, setCurrentSubcategories] = useState<any[]>([]);
  const [currentSubSubcategories, setCurrentSubSubcategories] = useState<any[]>([]);
  const [currentSubSubSubcategories, setCurrentSubSubSubcategories] = useState<any[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceFilters, setPriceFilters] = useState({
    under5k: false,
    between5kAnd15k: false,
    over15k: false,
  });
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const isLevel4 = searchParams.get('level4') === 'true';
    const isSubSub = searchParams.get('subsub') === 'true';
    const isSub = searchParams.get('sub') === 'true';

    if (!isSub && !isSubSub && !isLevel4 && slug && slug !== 'all' && categories.length > 0) {
      const cat = categories.find(c => c.slug === slug);
      setCurrentSubcategories(cat?.subcategories || []);
      setCurrentSubSubcategories([]);
      setCurrentSubSubSubcategories([]);
    } else if (isSub && slug && categories.length > 0) {
      let foundSubcat = null;
      for (const cat of categories) {
        const sub = cat.subcategories?.find((s: any) => s.slug === slug);
        if (sub) {
          foundSubcat = sub;
          break;
        }
      }
      setCurrentSubcategories([]);
      setCurrentSubSubcategories(foundSubcat?.sub_subcategories || []);
      setCurrentSubSubSubcategories([]);
    } else if (isSubSub && slug && categories.length > 0) {
      let foundSubSubcat: any = null;
      for (const cat of categories) {
        for (const sub of (cat.subcategories || [])) {
          const ssub = (sub.sub_subcategories || []).find((s: any) => s.slug === slug || s.id.toString() === slug);
          if (ssub) {
            foundSubSubcat = ssub;
            break;
          }
        }
        if (foundSubSubcat) break;
      }
      setCurrentSubcategories([]);
      setCurrentSubSubcategories([]);
      setCurrentSubSubSubcategories(foundSubSubcat?.sub_sub_subcategories || []);
    } else {
      setCurrentSubcategories([]);
      setCurrentSubSubcategories([]);
      setCurrentSubSubSubcategories([]);
    }
  }, [categories, slug, searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/categories', { signal: controller.signal, priority: 'high' } as any)
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const isSubcategory = searchParams.get('sub') === 'true';
    const isSubSubcategory = searchParams.get('subsub') === 'true';
    const isLevel4 = searchParams.get('level4') === 'true';

    const formatSlugToTitle = (s: string) => {
      if (!s) return s;
      return s
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const loadData = async () => {
      setLoading(true);
      
      let url = '/api/products';
      let newCategoryName = 'Tous les produits';
      let newCategoryImage = null;
      let newMobileCategoryImage = null;
      let newCategoryId = null;

      try {
        if (slug && slug !== 'all') {
          if (isLevel4) {
            url += `?sub_sub_subcategory=${slug}`;
            let foundName = formatSlugToTitle(slug);
            for (const cat of categories) {
              for (const sub of (cat.subcategories || [])) {
                for (const ss of (sub.sub_subcategories || [])) {
                  const sss = (ss.sub_sub_subcategories || []).find((s: any) => s.slug === slug || s.id.toString() === slug);
                  if (sss) {
                    foundName = sss.name;
                    break;
                  }
                }
              }
            }
            newCategoryName = getCategoryWithEmoji(foundName);
            try {
              const level4Cats = await fetchWithCache('/api/sub_sub_subcategories', { signal });
              if (Array.isArray(level4Cats)) {
                const found = level4Cats.find((s: any) => s.slug === slug || s.id.toString() === slug);
                if (found) {
                  newCategoryName = getCategoryWithEmoji(found.name);
                }
              }
            } catch (e) {}
          } else if (isSubSubcategory) {
            url += `?sub_subcategory=${slug}`;
            // Find the sub-subcategory name from the categories state
            let foundName = formatSlugToTitle(slug);
            for (const cat of categories) {
              for (const sub of (cat.subcategories || [])) {
                const ss = (sub.sub_subcategories || []).find((s: any) => s.slug === slug || s.id.toString() === slug);
                if (ss) {
                  foundName = ss.name;
                  break;
                }
              }
            }
            newCategoryName = getCategoryWithEmoji(foundName);
          } else if (isSubcategory) {
            url += `?subcategory=${slug}`;
            newCategoryName = getCategoryWithEmoji(formatSlugToTitle(slug));
            try {
              const subcats = await fetchWithCache('/api/subcategories', { signal });
              if (Array.isArray(subcats)) {
                const subcat = subcats.find((s: any) => s.slug === slug || s.id.toString() === slug);
                if (subcat) {
                  newCategoryName = getCategoryWithEmoji(subcat.name);
                  newCategoryId = subcat.category_id;
                }
              }
            } catch (e) {}
          } else {
            url += `?category=${slug}`;
            newCategoryName = getCategoryWithEmoji(formatSlugToTitle(slug));
            try {
              const cats = await fetchWithCache('/api/categories', { signal, priority: 'high' } as any);
              if (Array.isArray(cats)) {
                const cat = cats.find((c: any) => c.slug === slug);
                if (cat) {
                  newCategoryName = getCategoryWithEmoji(cat.name);
                  if (cat.slide_image) newCategoryImage = cat.slide_image;
                  if (cat.mobile_slide_image) newMobileCategoryImage = cat.mobile_slide_image;
                  newCategoryId = cat.id;
                }
              }
            } catch (e) {}
          }
        } else if (searchParams.get('ids')) {
          url += `?ids=${searchParams.get('ids')}`;
          newCategoryName = searchParams.get('title') || 'Notre Sélection';
        } else if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
          newCategoryName = `Résultats pour "${searchQuery}"`;
        }
        
        if (searchParams.get('sort')) {
          url += (url.includes('?') ? '&' : '?') + `sort=${searchParams.get('sort')}`;
        }
        if (searchParams.get('special_offers')) {
          url += (url.includes('?') ? '&' : '?') + `special_offers=${searchParams.get('special_offers')}`;
        }
        if (searchParams.get('title') && !searchParams.get('ids') && !searchQuery) {
          newCategoryName = searchParams.get('title') || newCategoryName;
        }

        url += (url.includes('?') ? '&' : '?') + `limit=1000`;

        const productsDataArray: any = await fetchWithCache(url, { signal, priority: 'high', maxAge: 60000 } as any).catch(() => []);
        let productsData = Array.isArray(productsDataArray) ? productsDataArray : [];

        if (!signal.aborted) {
          setCategoryName(newCategoryName);
          setCategoryImage(newCategoryImage);
          setMobileCategoryImage(newMobileCategoryImage);
          setCategoryId(newCategoryId);
          setProducts(productsData);
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          if (!signal.aborted) setLoading(false);
        }
      }
    };

    loadData();
      
    return () => controller.abort();
  }, [slug, searchQuery, searchParams, categories]);

  const getResizedImageUrl = (url: string | null, width: number) => {
    if (!url) return '';
    if (url.startsWith('/api/images/')) {
      return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
    }
    return url;
  };

  const filteredProducts = products.filter(product => {
    if (!priceFilters.under5k && !priceFilters.between5kAnd15k && !priceFilters.over15k) {
      return true;
    }
    
    const price = product.price;
    if (priceFilters.under5k && price < 5000) return true;
    if (priceFilters.between5kAnd15k && price >= 5000 && price <= 15000) return true;
    if (priceFilters.over15k && price > 15000) return true;
    
    return false;
  });

  useEffect(() => {
    // Close mobile filters when navigating
    setShowMobileFilters(false);
  }, [slug, searchParams]);

  const breadcrumbTrail = React.useMemo(() => {
    if (!slug || slug === 'all' || searchQuery || searchParams.get('ids')) return [];
    const isSub = searchParams.get('sub') === 'true';
    const isSubSub = searchParams.get('subsub') === 'true';
    const isLevel4 = searchParams.get('level4') === 'true';

    for (const c of categories) {
      if (!isSub && !isSubSub && !isLevel4 && c.slug === slug) {
        return [{ name: c.name, url: `/category/${c.slug}` }];
      }
      for (const s of (c.subcategories || [])) {
        if (isSub && s.slug === slug) {
          return [
            { name: c.name, url: `/category/${c.slug}` },
            { name: s.name, url: `/category/${s.slug}?sub=true` }
          ];
        }
        for (const ss of (s.sub_subcategories || [])) {
          if (isSubSub && ss.slug === slug) {
            return [
              { name: c.name, url: `/category/${c.slug}` },
              { name: s.name, url: `/category/${s.slug}?sub=true` },
              { name: ss.name, url: `/category/${ss.slug}?subsub=true` }
            ];
          }
          for (const sss of (ss.sub_sub_subcategories || [])) {
            if (isLevel4 && sss.slug === slug) {
              return [
                { name: c.name, url: `/category/${c.slug}` },
                { name: s.name, url: `/category/${s.slug}?sub=true` },
                { name: ss.name, url: `/category/${ss.slug}?subsub=true` },
                { name: sss.name, url: `/category/${sss.slug}?level4=true` }
              ];
            }
          }
        }
      }
    }
    return [{ name: categoryName, url: `/category/${slug}` }];
  }, [categories, slug, searchParams, categoryName, searchQuery]);

  const categoryBreadcrumbSchema = React.useMemo(() => {
    if (!slug || slug === 'all' || searchQuery || searchParams.get('ids')) return undefined;
    const items = [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.zorando.com/" }
    ];
    breadcrumbTrail.forEach((b, index) => {
      items.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": b.name,
        "item": `https://www.zorando.com${b.url}`
      });
    });
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items
    };
  }, [slug, searchQuery, searchParams, breadcrumbTrail]);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={slug && categorySEOData[slug] ? categorySEOData[slug].title : categoryName} 
        exactTitle={!!(slug && categorySEOData[slug])}
        description={slug && categorySEOData[slug] ? categorySEOData[slug].description : `Découvrez notre sélection de produits dans la catégorie ${categoryName}. Achetez au meilleur prix sur ZORANDO.`}
        keywords={slug && categorySEOData[slug]?.keywords ? categorySEOData[slug].keywords : undefined} 
        url={window.location.href}
        noindex={!!searchQuery || !!searchParams.get('ids')}
        schema={categoryBreadcrumbSchema}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full bg-white px-4 py-3 rounded-xl shadow-sm flex items-center justify-between font-bold text-gray-800"
          >
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-orange-500" />
              <span>Catégories et Filtres</span>
            </div>
            {showMobileFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 shrink-0 transition-all duration-300 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Catégories</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/category/all" 
                  className={`block font-medium ${slug === 'all' && !searchQuery ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'}`}
                >
                  Toutes les catégories
                </Link>
              </li>
              {categories.map(cat => {
                const isCatActive = slug === cat.slug && searchParams.get('sub') !== 'true' && searchParams.get('subsub') !== 'true' && searchParams.get('level4') !== 'true';
                const hasActiveDescendant = cat.subcategories?.some((s: any) => 
                  s.slug === slug || 
                  s.sub_subcategories?.some((ss: any) => ss.slug === slug || ss.sub_sub_subcategories?.some((sss: any) => sss.slug === slug))
                );

                return (
                  <li key={cat.id}>
                    <Link 
                      to={`/category/${cat.slug}`} 
                      className={`block font-bold text-[15px] ${isCatActive ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'}`}
                    >
                      <CategoryNameDisplay name={cat.name} />
                    </Link>
                    {(isCatActive || hasActiveDescendant) && cat.subcategories && cat.subcategories.length > 0 && (
                      <ul className="pl-3 mt-1.5 space-y-1 border-l-2 border-orange-100">
                        {cat.subcategories.map((sub: any) => {
                          const isSubActive = slug === sub.slug && searchParams.get('sub') === 'true';
                          const hasActiveSubSub = sub.sub_subcategories?.some((ss: any) => 
                            ss.slug === slug || 
                            ss.sub_sub_subcategories?.some((sss: any) => sss.slug === slug)
                          );

                          return (
                            <li key={sub.id}>
                              <Link 
                                to={`/category/${sub.slug}?sub=true`} 
                                className={`block font-semibold text-[14px] ${isSubActive ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'}`}
                              >
                                <CategoryNameDisplay name={sub.name} />
                              </Link>
                              {(isSubActive || hasActiveSubSub) && sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                                <ul className="pl-3 mt-1 space-y-1 border-l border-orange-100">
                                  {sub.sub_subcategories.map((ssub: any) => {
                                    const isSubSubActive = slug === ssub.slug && searchParams.get('subsub') === 'true';
                                    const hasActiveL4 = ssub.sub_sub_subcategories?.some((sss: any) => sss.slug === slug);

                                    return (
                                      <li key={ssub.id}>
                                        <Link 
                                          to={`/category/${ssub.slug}?subsub=true`} 
                                          className={`block text-[13px] font-medium ${isSubSubActive ? 'text-orange-500 font-semibold' : 'text-gray-600 hover:text-orange-500'}`}
                                        >
                                          <CategoryNameDisplay name={ssub.name} />
                                        </Link>
                                        {(isSubSubActive || hasActiveL4) && ssub.sub_sub_subcategories && ssub.sub_sub_subcategories.length > 0 && (
                                          <ul className="pl-3 mt-1 space-y-1 border-l border-orange-100">
                                            {ssub.sub_sub_subcategories.map((sss: any) => (
                                              <li key={sss.id}>
                                                <Link 
                                                  to={`/category/${sss.slug}?level4=true`} 
                                                  className={`block text-[12px] ${slug === sss.slug && searchParams.get('level4') === 'true' ? 'text-orange-500 font-bold' : 'text-gray-500 hover:text-orange-500'}`}
                                                >
                                                  {sss.name}
                                                </Link>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Filtres</h3>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Prix</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-orange-500 focus:ring-orange-500" 
                    checked={priceFilters.under5k}
                    onChange={(e) => setPriceFilters(prev => ({ ...prev, under5k: e.target.checked }))}
                  />
                  Moins de 5 000 DA
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-orange-500 focus:ring-orange-500" 
                    checked={priceFilters.between5kAnd15k}
                    onChange={(e) => setPriceFilters(prev => ({ ...prev, between5kAnd15k: e.target.checked }))}
                  />
                  5 000 - 15 000 DA
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded text-orange-500 focus:ring-orange-500" 
                    checked={priceFilters.over15k}
                    onChange={(e) => setPriceFilters(prev => ({ ...prev, over15k: e.target.checked }))}
                  />
                  Plus de 15 000 DA
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {breadcrumbTrail.length > 1 && (
            <div className="text-xs md:text-sm text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-orange-500">Accueil</Link>
              {breadcrumbTrail.map((crumb, idx) => (
                <React.Fragment key={crumb.url}>
                  <span>/</span>
                  {idx === breadcrumbTrail.length - 1 ? (
                    <span className="text-gray-800 font-semibold">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.url} className="hover:text-orange-500">{crumb.name}</Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {loading ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[16/5] bg-gray-200 animate-pulse hidden md:block"></div>
          ) : categoryImage ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full md:aspect-[16/5] bg-gray-100 items-center justify-center hidden md:flex">
              <picture className="w-full h-full">
                {mobileCategoryImage && (
                  <source media="(max-width: 767px)" srcSet={getResizedImageUrl(mobileCategoryImage, 800)} />
                )}
                <img 
                  src={getResizedImageUrl(categoryImage, 1200)} 
                  alt={categoryName} 
                  className="w-full h-full object-cover object-center" 
                  referrerPolicy="no-referrer" 
                  fetchPriority="high"
                  loading="eager"
                />
              </picture>
            </div>
          ) : categoryId ? (
            <div className="hidden md:block mb-8">
              <Slider categoryId={categoryId} />
            </div>
          ) : null}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {slug && categorySEOData[slug] ? categorySEOData[slug].h1 : categoryName}
              </h1>
              <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{filteredProducts.length} produits trouvés</span>
            </div>
          </div>

          {!loading && currentSubcategories.length > 0 && (
            <div className="mb-10 sm:mb-14">
              <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                <span className="w-2.5 h-6 bg-[#FF6B00] rounded-full"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Sous-catégories
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentSubcategories.map(sub => (
                  <SubCategoryCard key={sub.id} item={sub} parentName={categoryName} queryParam="sub" />
                ))}
              </div>
            </div>
          )}

          {!loading && currentSubSubcategories.length > 0 && (
            <div className="mb-10 sm:mb-14">
              <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                <span className="w-2.5 h-6 bg-[#FF6B00] rounded-full"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Sous-sous-catégories
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentSubSubcategories.map(subsub => (
                  <SubCategoryCard key={subsub.id} item={subsub} parentName={categoryName} queryParam="subsub" />
                ))}
              </div>
            </div>
          )}

          {!loading && currentSubSubSubcategories.length > 0 && (
            <div className="mb-10 sm:mb-14">
              <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                <span className="w-2.5 h-6 bg-[#FF6B00] rounded-full"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Catégories spécialisées
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentSubSubSubcategories.map(sss => (
                  <SubCategoryCard key={sss.id} item={sss} parentName={categoryName} queryParam="level4" />
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            {slug && categorySEOData[slug] && (
              <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="prose prose-sm text-gray-600 max-w-none">
                  {categorySEOData[slug].intro.split('\n\n').map((paragraph, idx) => {
                    const boldMatch = paragraph.match(/^\*\*(.*?)\*\*(.*)/);
                    if (boldMatch) {
                      return <p key={idx} className="mb-2"><strong className="text-gray-800">{boldMatch[1]}</strong>{boldMatch[2]}</p>;
                    }
                    return <p key={idx} className="mb-2">{paragraph}</p>;
                  })}
                </div>
              </div>
            )}
            {slug && categorySEOData[slug] && categorySEOData[slug].links && (
              <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Continuez votre visite sur ZORANDO :</h3>
                <ul className="space-y-3">
                  {categorySEOData[slug].links.map((link, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <Link to={link.url} className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 text-lg">Aucun produit trouvé pour cette catégorie.</p>
              <Link to="/" className="mt-4 inline-block text-orange-500 hover:underline">Retourner à l'accueil</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
