import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore, Product } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { getCategoryWithEmoji, CategoryNameDisplay } from '../components/Layout';
import Slider from '../components/Slider';

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
    fetch('/api/categories', { signal: controller.signal, priority: 'high' } as any)
      .then(res => res.json())
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
            let foundName = slug;
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
            const res = await fetch('/api/subcategories', { signal });
            if (res.ok) {
              const subcats = await res.json();
              if (Array.isArray(subcats)) {
                const subcat = subcats.find((s: any) => s.slug === slug || s.id.toString() === slug);
                if (subcat) {
                  newCategoryName = getCategoryWithEmoji(subcat.name);
                  newCategoryId = subcat.category_id;
                }
              }
            }
          } else {
            url += `?category=${slug}`;
            const res = await fetch('/api/categories', { signal, priority: 'high' } as any);
            if (res.ok) {
              const cats = await res.json();
              if (Array.isArray(cats)) {
                const cat = cats.find((c: any) => c.slug === slug);
                if (cat) {
                  newCategoryName = getCategoryWithEmoji(cat.name);
                  if (cat.slide_image) newCategoryImage = cat.slide_image;
                  if (cat.mobile_slide_image) newMobileCategoryImage = cat.mobile_slide_image;
                  newCategoryId = cat.id;
                }
              }
            }
          }
        } else if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`;
          newCategoryName = `Résultats pour "${searchQuery}"`;
        }

        const productsRes = await fetch(url, { signal, priority: 'high' } as any);
        let productsData = [];
        if (productsRes.ok) {
          const data = await productsRes.json();
          if (Array.isArray(data)) productsData = data;
        }

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
  }, [slug, searchQuery, searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={categoryName} 
        description={`Découvrez notre sélection de produits dans la catégorie ${categoryName}. Achetez au meilleur prix sur Yumi.`} 
        url={window.location.href}
      />
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0">
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
                    className={`block font-medium ${slug === cat.slug && searchParams.get('sub') !== 'true' ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'}`}
                  >
                    <CategoryNameDisplay name={cat.name} />
                  </Link>
                  {(slug === cat.slug || cat.subcategories.some((s: any) => s.slug === slug)) && cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className="pl-4 mt-2 space-y-1 border-l-2 border-orange-100">
                      {cat.subcategories.map((sub: any) => (
                        <li key={sub.id}>
                          <Link 
                            to={`/category/${sub.slug}?sub=true`} 
                            className={`block text-sm ${slug === sub.slug && searchParams.get('sub') === 'true' ? 'text-orange-500 font-bold' : 'text-gray-600 hover:text-orange-500'}`}
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
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" />
                  Moins de 5 000 DA
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" />
                  5 000 - 15 000 DA
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" />
                  Plus de 15 000 DA
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] sm:aspect-[1/1] md:aspect-[16/5] bg-gray-200 animate-pulse"></div>
          ) : categoryImage ? (
            <div className={`mb-8 rounded-xl overflow-hidden shadow-md relative w-full aspect-[4/5] sm:aspect-[1/1] md:aspect-[16/5] bg-gray-100 items-center justify-center ${!mobileCategoryImage ? 'hidden md:flex' : 'flex'}`}>
              <picture className="w-full h-full">
                {mobileCategoryImage && (
                  <source media="(max-width: 767px)" srcSet={mobileCategoryImage} />
                )}
                <img 
                  src={categoryImage} 
                  alt={categoryName} 
                  className="w-full h-full object-cover object-center" 
                  referrerPolicy="no-referrer" 
                  fetchPriority="high"
                  loading="eager"
                />
              </picture>
            </div>
          ) : (
            <Slider categoryId={categoryId} />
          )}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">{categoryName}</h1>
            <span className="text-sm text-gray-500">{products.length} produits trouvés</span>
          </div>

          {!loading && currentSubcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Sous-catégories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentSubcategories.map(sub => (
                  <Link 
                    key={sub.id} 
                    to={`/category/${sub.slug}?sub=true`}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors">
                      {sub.image ? (
                        <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl">{getCategoryWithEmoji(sub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-center text-sm group-hover:text-orange-500 transition-colors">{sub.name}</span>
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
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors">
                      {subsub.image ? (
                        <img src={subsub.image} alt={subsub.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl">{getCategoryWithEmoji(subsub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-center text-sm group-hover:text-orange-500 transition-colors">{subsub.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
            </div>
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
