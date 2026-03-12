import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';

export default function Brands() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        setBrands(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch brands", err);
        setLoading(false);
      });
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
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Toutes les marques</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Toutes nos marques</h1>
        <p className="text-gray-600 mb-8">Découvrez les produits de vos marques préférées.</p>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {brands.map(brand => (
              <Link 
                key={brand.id} 
                to={`/brands/${brand.slug}`} 
                className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-xl hover:border-orange-500 hover:shadow-md transition-all group bg-gray-50"
              >
                {brand.image ? (
                  <img src={brand.image} alt={brand.name} className="w-20 h-20 object-contain mb-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm">
                    <span className="font-bold text-2xl">{brand.name.charAt(0)}</span>
                  </div>
                )}
                <span className="font-bold text-gray-800 text-center group-hover:text-orange-600">{brand.name}</span>
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
