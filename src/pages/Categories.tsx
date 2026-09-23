import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { fetchWithCache, getResizedImageUrl } from '../lib/utils';
import { CategoryNameDisplay } from '../components/Layout';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  subcategories?: SubCategory[];
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/categories', { signal: controller.signal })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch categories", err);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Toutes nos catégories | ZORANDO" 
        exactTitle={true}
        description="Découvrez toutes les catégories de produits sur ZORANDO Algérie. Mode, Électroménager, Téléphonie, Beauté, Maison et bien plus."
      />
      
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Toutes les catégories</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Toutes nos catégories</h1>
          <p className="text-gray-600">Explorez l'ensemble de nos univers et collections pour trouver vos produits.</p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div 
                key={category.id}
                className="group border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col bg-white"
              >
                <Link 
                  to={`/category/${category.slug}`}
                  className="relative aspect-video w-full overflow-hidden bg-gray-50 flex items-center justify-center"
                >
                  {category.image ? (
                    <img 
                      src={getResizedImageUrl(category.image, 600)} 
                      alt={category.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Layers size={48} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white font-bold text-lg drop-shadow-sm">
                      <CategoryNameDisplay name={category.name} />
                    </span>
                  </div>
                </Link>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Sous-catégories
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.subcategories.slice(0, 5).map(sub => (
                          <Link
                            key={sub.id}
                            to={`/category/${sub.slug}?sub=true`}
                            className="inline-block text-xs bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 px-2.5 py-1 rounded-md transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                        {category.subcategories.length > 5 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{category.subcategories.length - 5} autres
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 text-xs text-gray-400">
                      Découvrez tous les articles de cette collection
                    </div>
                  )}

                  <Link 
                    to={`/category/${category.slug}`}
                    className="inline-flex items-center justify-between w-full pt-3 border-t border-gray-100 text-sm font-semibold text-orange-600 group-hover:text-orange-700 transition-colors"
                  >
                    <span>Voir tous les produits</span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Layers size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune catégorie disponible</h3>
            <p className="text-gray-500">Revenez plus tard pour découvrir nos collections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
