import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import SEO from '../components/SEO';

export default function Brands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/brands', { signal: controller.signal })
      .then(res => res.json())
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
        title="Toutes les marques" 
        description="Découvrez toutes les marques de produits disponibles sur Yumi."
      />
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Toutes les marques</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Toutes nos marques</h1>
        <p className="text-gray-600 mb-8">Découvrez les produits de vos marques préférées.</p>

        {brands.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {brands.map(brand => (
              <Link 
                key={brand.id} 
                to={`/brands/${brand.slug}`} 
                className="flex flex-col items-center justify-center w-[160px] h-[120px] sm:w-[180px] sm:h-[140px] rounded-[12px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-[1.03] transition-all duration-300 group"
              >
                {brand.image ? (
                  <img src={brand.image} alt={brand.name} className="w-[80%] h-[80%] object-contain p-4" />
                ) : (
                  <div className="w-[80%] h-[80%] flex items-center justify-center text-gray-400 p-4">
                    <span className="font-bold text-4xl">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <span className="font-bold text-gray-800 text-center group-hover:text-orange-600 px-4 truncate w-full">{brand.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune marque disponible</h3>
            <p className="text-gray-500">Revenez plus tard pour découvrir nos marques partenaires.</p>
          </div>
        )}
      </div>
    </div>
  );
}
