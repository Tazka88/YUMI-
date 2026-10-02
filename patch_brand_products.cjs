const fs = require('fs');

const code = `import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import SEO from '../components/SEO';
import { Product } from '../store/cartStore';
import { fetchWithCache } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

interface ExtractedCategory {
  id: number;
  name: string;
  slug: string;
}

export default function BrandProducts() {
  const { slug, categorySlug } = useParams();
  const [brand, setBrand] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch brand details
    fetch(\`/api/brands/\${slug}\`, { signal })
      .then(res => {
        if (!res.ok) throw new Error('Brand not found');
        return res.json();
      })
      .then(data => {
        setBrand(data);
        // Fetch ALL products for this brand
        return fetchWithCache(\`/api/products?brand=\${data.id}&limit=1000\`, { signal, maxAge: 60000 });
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAllProducts(data);
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

  // Extract unique categories from all products
  const brandCategories = useMemo(() => {
    const map = new Map<string, ExtractedCategory>();
    allProducts.forEach(p => {
      // Check sub-subcategories first
      if (p.sub_subcategory_id && p.sub_subcategory_slug && p.sub_subcategory_name) {
        map.set(p.sub_subcategory_slug, { id: p.sub_subcategory_id, name: p.sub_subcategory_name, slug: p.sub_subcategory_slug });
      } 
      // Then check subcategories
      else if (p.subcategory_id && p.subcategory_slug && p.subcategory_name) {
        map.set(p.subcategory_slug, { id: p.subcategory_id, name: p.subcategory_name, slug: p.subcategory_slug });
      } 
      // Then check main categories
      else if (p.category_id && p.category_slug && p.category_name) {
        map.set(p.category_slug, { id: p.category_id, name: p.category_name, slug: p.category_slug });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter products based on current categorySlug
  const displayedProducts = useMemo(() => {
    if (!categorySlug) return allProducts;
    return allProducts.filter(p => 
      p.category_slug === categorySlug || 
      p.subcategory_slug === categorySlug || 
      p.sub_subcategory_slug === categorySlug
    );
  }, [allProducts, categorySlug]);

  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    return brandCategories.find(c => c.slug === categorySlug) || null;
  }, [brandCategories, categorySlug]);

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
        <SEO title="Marque introuvable" description="La marque demandée n'existe pas." noindex={true} />
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Marque introuvable</h1>
        <p className="text-gray-600 mb-8">La marque que vous recherchez n'existe pas ou a été supprimée.</p>
        <Link to="/brands" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors">
          Voir toutes les marques
        </Link>
      </div>
    );
  }

  // --- SEO & Content Generation ---
  
  const isCategoryPage = !!categorySlug && !!currentCategory;
  
  // Base URLs
  const baseUrl = \`https://www.zorando.com/brands/\${brand.slug}\`;
  const canonicalUrl = isCategoryPage ? \`\${baseUrl}/\${currentCategory.slug}\` : baseUrl;
  
  // Titles & H1
  let pageTitle = '';
  let h1Title = '';
  let metaDescription = '';
  let seoIntro = null;

  if (isCategoryPage) {
    h1Title = \`\${currentCategory.name} \${brand.name} Algérie\`;
    pageTitle = \`\${currentCategory.name} \${brand.name} Algérie – \${currentCategory.name} et appareils | Zorando\`;
    metaDescription = \`Découvrez les \${currentCategory.name.toLowerCase()} \${brand.name} disponibles en Algérie sur Zorando. Consultez les modèles, caractéristiques et prix des \${currentCategory.name.toLowerCase()} \${brand.name}.\`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de <strong>\${currentCategory.name.toLowerCase()} \${brand.name}</strong> en Algérie. 
          Que vous cherchiez la performance, la durabilité ou le meilleur rapport qualité-prix, 
          les produits de la gamme \${currentCategory.name.toLowerCase()} \${brand.name} répondront à vos besoins. 
          Profitez de la qualité \${brand.name} avec la garantie et le service Zorando.
        </p>
      </div>
    );
  } else {
    h1Title = brand.h1_title || \`\${brand.name} Algérie – Électroménager et appareils \${brand.name}\`;
    pageTitle = brand.seo_title || \`\${brand.name} Algérie – Produits et Électroménager | Zorando\`;
    metaDescription = brand.seo_description || brand.description || \`Découvrez tous les produits de la marque \${brand.name} disponibles en Algérie sur Zorando. Électroménager, appareils et bien plus au meilleur prix.\`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Bienvenue sur la boutique officielle <strong>\${brand.name} Algérie</strong> sur Zorando. 
          Nous proposons une large gamme de produits et d'<strong>électroménager \${brand.name}</strong>, 
          reconnus pour leur qualité et leur fiabilité. 
          Découvrez ci-dessous toutes les <strong>catégories d'appareils \${brand.name}</strong> disponibles 
          pour faciliter votre quotidien. Achetez en ligne vos produits \${brand.name} en toute sécurité en Algérie.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
      />
      
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <ChevronRight size={14} />
        <Link to="/brands" className="hover:text-orange-500">Marques</Link>
        <ChevronRight size={14} />
        {isCategoryPage ? (
          <>
            <Link to={\`/brands/\${brand.slug}\`} className="hover:text-orange-500">\${brand.name}</Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">\${currentCategory.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">\${brand.name}</span>
        )}
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {brand.image ? (
          <Link to={\`/brands/\${brand.slug}\`} className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 hover:border-orange-200 transition-colors">
            <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-[15px]" />
          </Link>
        ) : (
          <Link to={\`/brands/\${brand.slug}\`} className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 p-[15px] hover:border-orange-200 transition-colors">
            <span className="text-4xl font-bold text-gray-400">\${brand.name.charAt(0)}</span>
          </Link>
        )}
        
        <div className="text-left flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{h1Title}</h1>
          
          {/* SEO Natural Text */}
          {seoIntro}

          <div className="mt-2 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
            {displayedProducts.length} produit{displayedProducts.length !== 1 ? 's' : ''} {isCategoryPage ? 'dans cette catégorie' : 'au total'}
          </div>
        </div>
      </div>

      {/* Dynamic Brand Categories Section (Only on main brand page) */}
      {!isCategoryPage && brandCategories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories \${brand.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2">\${cat.name} \${brand.name} Algérie</h3>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  Découvrez les \${cat.name.toLowerCase()} et appareils \${brand.name} disponibles en Algérie.
                </p>
                <Link 
                  to={\`/brands/\${brand.slug}/\${cat.slug}\`}
                  className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Voir les \${cat.name.toLowerCase()} \${brand.name}
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Area */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isCategoryPage ? \`Tous les produits \${currentCategory.name} \${brand.name}\` : \`Tous les produits \${brand.name}\`}
            </h2>
          </div>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 mb-6">Il n'y a pas de produits disponibles dans cette catégorie pour le moment.</p>
              <Link to={\`/brands/\${brand.slug}\`} className="text-orange-500 hover:text-orange-600 font-medium">
                Voir tous les produits \${brand.name}
              </Link>
            </div>
          )}
        </div>

        {/* Existing SEO Sidebar Content (fallback if brand has custom HTML) */}
        {!isCategoryPage && brand.seo_content && (
          <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 mt-8 lg:mt-0">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 seo-description sticky top-24">
              <div dangerouslySetInnerHTML={{ __html: brand.seo_content }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/BrandProducts.tsx', code);
