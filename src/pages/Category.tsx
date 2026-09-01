import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { getCategoryWithEmoji, CategoryNameDisplay } from '../components/Layout';
import Slider from '../components/Slider';
import { fetchWithCache } from '../lib/utils';
import { categorySEOData } from '../utils/seoData';

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceFilters, setPriceFilters] = useState({
    under5k: false,
    between5kAnd15k: false,
    over15k: false,
  });
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    if (searchParams.get('sub') !== 'true' && searchParams.get('subsub') !== 'true' && slug && slug !== 'all' && categories.length > 0) {
      const cat = categories.find(c => c.slug === slug);
      setCurrentSubcategories(cat?.subcategories || []);
      setCurrentSubSubcategories([]);
    } else if (searchParams.get('sub') === 'true' && slug && categories.length > 0) {
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
    } else {
      setCurrentSubcategories([]);
      setCurrentSubSubcategories([]);
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
          if (isSubSubcategory) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={slug && categorySEOData[slug] ? categorySEOData[slug].title : categoryName} 
        exactTitle={!!(slug && categorySEOData[slug])}
        description={slug && categorySEOData[slug] ? categorySEOData[slug].description : `Découvrez notre sélection de produits dans la catégorie ${categoryName}. Achetez au meilleur prix sur ZORANDO.`}
        keywords={slug && categorySEOData[slug]?.keywords ? categorySEOData[slug].keywords : undefined} 
        url={window.location.href}
        noindex={!!searchQuery || !!searchParams.get('ids')}
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
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className={`block font-bold text-[15px] ${slug === cat.slug && searchParams.get('sub') !== 'true' ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'}`}
                  >
                    <CategoryNameDisplay name={cat.name} />
                  </Link>
                  {(slug === cat.slug || cat.subcategories.some((s: any) => s.slug === slug)) && cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="pl-4 mt-2 space-y-1 border-l-2 border-orange-100">
                      {cat.subcategories.map((sub: any) => (
                        <li key={sub.id}>
                          <Link 
                            to={`/category/${sub.slug}?sub=true`} 
                            className={`block font-semibold text-[14px] ${slug === sub.slug && searchParams.get('sub') === 'true' ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'}`}
                          >
                            <CategoryNameDisplay name={sub.name} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
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
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Sous-catégories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentSubcategories.map(sub => (
                  <Link 
                    key={sub.id} 
                    to={`/category/${sub.slug}?sub=true`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center group overflow-hidden"
                  >
                    <div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {sub.image ? (
                        <img 
                          src={getResizedImageUrl(sub.image, 400)} 
                          alt={sub.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-4xl">{getCategoryWithEmoji(sub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <div className="p-3 w-full text-center border-t border-gray-50">
                      <span className="font-medium text-gray-800 text-sm group-hover:text-orange-500 transition-colors line-clamp-1">{sub.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && currentSubSubcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Sous-sous-catégories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentSubSubcategories.map(subsub => (
                  <Link 
                    key={subsub.id} 
                    to={`/category/${subsub.slug}?subsub=true`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center group overflow-hidden"
                  >
                    <div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {subsub.image ? (
                        <img 
                          src={getResizedImageUrl(subsub.image, 400)} 
                          alt={subsub.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-4xl">{getCategoryWithEmoji(subsub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <div className="p-3 w-full text-center border-t border-gray-50">
                      <span className="font-medium text-gray-800 text-sm group-hover:text-orange-500 transition-colors line-clamp-1">{subsub.name}</span>
                    </div>
                  </Link>
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
