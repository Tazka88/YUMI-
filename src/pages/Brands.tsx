import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { fetchWithCache, getResizedImageUrl } from '../lib/utils';

export default function Brands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/brands', { signal: controller.signal })
      .then(data => {
        if (Array.isArray(data)) {
          setBrands(data);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch brands", err);
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
        title="Toutes nos marques : Qualité et Choix Garantis" 
        exactTitle={false}
        description="Parcourez toutes les grandes marques disponibles sur ZORANDO. Des produits authentiques et certifiés dans toutes les catégories. Achetez vos marques préférées !"
      />
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Toutes les marques</span>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 md:p-8 mb-8 border border-gray-100">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Toutes nos marques</h1>
        <p className="text-gray-500 mb-8 text-sm">Découvrez les boutiques officielles et produits de vos marques préférées.</p>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {brands.map(brand => (
              <Link 
                key={brand.id} 
                to={`/brands/${brand.slug}`} 
                className="flex flex-col justify-between h-[130px] sm:h-[145px] rounded-2xl bg-white border border-gray-200/80 p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex-1 w-full flex items-center justify-center p-1.5 overflow-hidden">
                  {brand.image ? (
                    <img 
                      src={getResizedImageUrl(brand.image, 240)} 
                      alt={brand.name} 
                      className="max-h-[68px] sm:max-h-[80px] w-auto max-w-[94%] object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs" 
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center text-gray-400">
                      <span className="font-extrabold text-3xl">{brand.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-800 truncate group-hover:text-orange-600 transition-colors">{brand.name}</span>
                  <ChevronRight size={13} className="text-gray-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune marque disponible</h3>
            <p className="text-gray-500">Revenez plus tard pour découvrir nos nouvelles marques.</p>
          </div>
        )}
      </div>
    </div>
  );
}
