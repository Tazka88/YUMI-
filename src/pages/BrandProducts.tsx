import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { Product } from '../store/cartStore';

export default function BrandProducts() {
  const { slug } = useParams();
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch brand details
    fetch(`/api/brands/${slug}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error('Brand not found');
        return res.json();
      })
      .then(data => {
        setBrand(data);
        // Fetch products for this brand
        return fetch(`/api/products?brand=${data.id}`, { signal });
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch brand or products", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="Marque introuvable" description="La marque demandée n'existe pas." />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Marque introuvable</h1>
        <p className="text-gray-600 mb-8">La marque que vous recherchez n'existe pas ou a été supprimée.</p>
        <Link to="/brands" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors">
          Voir toutes les marques
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="sr-only">Nos Marques</h1>
      <SEO 
        title={`Produits ${brand.name}`} 
        description={brand.description || `Découvrez tous les produits de la marque ${brand.name} sur Yumi.`}
        image={brand.image}
      />
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <span>/</span>
        <Link to="/brands" className="hover:text-orange-500">Marques</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{brand.name}</span>
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
        {brand.image ? (
          <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
            <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-[15px]" />
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 p-[15px]">
            <span className="text-4xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
          </div>
        )}
        
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{brand.name}</h1>
          {brand.description && (
            <p className="text-gray-600 max-w-2xl">{brand.description}</p>
          )}
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
            {products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun produit pour le moment</h3>
          <p className="text-gray-500 mb-6">Cette marque n'a pas encore de produits disponibles dans notre catalogue.</p>
          <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium">
            Retour à l'accueil
          </Link>
        </div>
      )}
    </div>
  );
}
