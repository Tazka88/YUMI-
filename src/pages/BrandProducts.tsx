import { useState, useEffect, useMemo } from 'react';
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
  level: 'category' | 'subcategory' | 'sub_subcategory';
}

export default function BrandProducts() {
  const { slug, categorySlug } = useParams();
  const [brand, setBrand] = useState<any>(null);
  const [brandCategories, setBrandCategories] = useState<ExtractedCategory[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let currentBrandId: number;

    setLoading(true);

    // Fetch brand details first
    fetch(`/api/brands/${slug}`, { signal })
      .then(res => {
        if (!res.ok) throw new Error('Brand not found');
        return res.json();
      })
      .then(data => {
        setBrand(data);
        currentBrandId = data.id;
        
        // Fetch brand categories first to know the level of the categorySlug
        return fetchWithCache(`/api/brands/${slug}/categories`, { signal, maxAge: 60000 });
      })
      .then((catsData: ExtractedCategory[]) => {
        if (Array.isArray(catsData)) {
          setBrandCategories(catsData);
        }
        
        let productsUrl = `/api/products?brand=${currentBrandId}&limit=100`;
        
        if (categorySlug && Array.isArray(catsData)) {
          const matchedCategory = catsData.find(c => c.slug === categorySlug);
          if (matchedCategory) {
            productsUrl += `&${matchedCategory.level}=${categorySlug}`;
          }
        }

        return fetchWithCache(productsUrl, { signal, maxAge: 60000 });
      })
      .then(prodsData => {
        if (Array.isArray(prodsData)) {
          setDisplayedProducts(prodsData);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch brand data", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug, categorySlug]);

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
  const baseUrl = `https://www.zorando.com/brands/${brand.slug}`;
  const canonicalUrl = isCategoryPage ? `${baseUrl}/${currentCategory.slug}` : baseUrl;
  
  // Titles & H1
  let pageTitle = '';
  let h1Title = '';
  let metaDescription = '';
  let seoIntro = null;

  let bottomSeoContent = null;
  if (brand.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires') {
    h1Title = "Bouilloires Moulinex en Algérie";
    pageTitle = "Bouilloires Moulinex en Algérie | Prix & Achat | ZORANDO";
    metaDescription = "Découvrez les bouilloires Moulinex disponibles chez ZORANDO : 0,8 L, 1,2 L, 1,7 L, 2000 W, 2400 W et plus. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.";
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-700 mb-6 space-y-4">
        <p>Vous recherchez une bouilloire Moulinex en Algérie pour préparer rapidement votre thé, café ou infusion ? ZORANDO vous propose une sélection de bouilloires électriques Moulinex adaptées à différents besoins et budgets. Retrouvez des modèles compacts de 0,8 L, des capacités de 1,2 L et des bouilloires familiales de 1,7 L, avec différentes puissances comme 2000 W et 2400 W selon les modèles.</p>
        <p>Comparez facilement les bouilloires Moulinex disponibles : capacité, puissance, matière, filtre anticalcaire, socle 360°, arrêt automatique et autres caractéristiques techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
        <p>Commandez votre bouilloire Moulinex en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
      </div>
    );
    bottomSeoContent = (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Quelle bouilloire Moulinex choisir ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Le choix dépend avant tout de votre utilisation quotidienne. Pour une utilisation familiale, une grande capacité de 1,7 L sera idéale. Si vous avez peu de place ou une utilisation individuelle, les capacités de 0,8 L ou 1,2 L sont très pratiques. Les puissances varient généralement entre 2000 W et 2400 W : une puissance plus élevée permettra à l'eau de bouillir plus vite.</p>
          <p>La majorité de ces modèles sont sans fil sur socle 360°, et certains bénéficient d'une finition inox élégante ou intègrent un filtre anticalcaire amovible pour faciliter l'entretien.</p>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Les bouilloires Moulinex disponibles chez ZORANDO</h2>
        <div className="prose prose-sm max-w-none text-gray-700 mb-8 space-y-4">
          <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre capacité, puissance, et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle. Vous pouvez consulter nos <Link to="/brands/electromenager-moulinex-algerie" className="text-orange-500 font-medium hover:underline">autres produits Moulinex</Link> pour équiper votre cuisine.</p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">FAQ – Bouilloires Moulinex</h2>
        <div className="space-y-6 mb-8">
          <div>
            <h3 className="font-bold text-gray-800">Quelle bouilloire Moulinex choisir pour une famille ?</h3>
            <p className="text-gray-700 text-sm mt-1">Pour une utilisation familiale, une bouilloire Moulinex de 1,7 L offre une capacité adaptée pour chauffer davantage d'eau en une seule fois. Le choix final dépend toutefois des besoins et des caractéristiques du modèle disponible.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quel est le prix d'une bouilloire Moulinex en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Le prix dépend du modèle, de sa capacité, de sa puissance et de ses fonctionnalités. ZORANDO affiche le prix actuel directement sur chaque fiche produit afin de permettre de comparer les modèles Moulinex disponibles.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Quelle capacité choisir pour une bouilloire Moulinex ?</h3>
            <p className="text-gray-700 text-sm mt-1">Une capacité de 0,8 L convient notamment pour une utilisation individuelle ou lorsque peu d'eau est nécessaire. Une capacité de 1,2 L offre un compromis entre encombrement et quantité d'eau, tandis qu'une bouilloire de 1,7 L convient davantage lorsque plusieurs tasses doivent être préparées.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Les bouilloires Moulinex sont-elles disponibles avec livraison en Algérie ?</h3>
            <p className="text-gray-700 text-sm mt-1">Oui. Les bouilloires Moulinex disponibles sur ZORANDO peuvent être commandées en ligne avec livraison dans les 58 wilayas d'Algérie et paiement à la livraison, selon les conditions affichées sur la fiche du produit.</p>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Pourquoi acheter une bouilloire Moulinex chez ZORANDO ?</h2>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>ZORANDO vous permet de comparer plusieurs modèles de bouilloires Moulinex selon leur capacité, leur puissance, leur design et leurs fonctionnalités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
        </div>
      </div>
    );
  } else if (isCategoryPage) {
    h1Title = `${currentCategory.name} ${brand.name} Algérie`;
    pageTitle = `${currentCategory.name} ${brand.name} Algérie – ${currentCategory.name} au meilleur prix | Zorando`;
    metaDescription = `Découvrez les ${currentCategory.name.toLowerCase()} ${brand.name} disponibles en Algérie sur Zorando. Consultez les modèles, caractéristiques et prix des ${currentCategory.name.toLowerCase()} ${brand.name}.`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de <strong>{currentCategory.name.toLowerCase()} {brand.name}</strong> en Algérie. 
          Que vous cherchiez la performance, la durabilité ou le meilleur rapport qualité-prix, 
          les produits de la gamme {currentCategory.name.toLowerCase()} {brand.name} répondront à vos besoins. 
          Profitez de la qualité {brand.name} avec la garantie et le service Zorando.
        </p>
      </div>
    );
  } else {
    h1Title = brand.h1_title || `${brand.name} Algérie – Tous les produits ${brand.name}`;
    pageTitle = brand.seo_title || `${brand.name} Algérie – Catalogue de produits | Zorando`;
    metaDescription = brand.seo_description || brand.description || `Découvrez tous les produits de la marque ${brand.name} disponibles en Algérie sur Zorando. Le meilleur catalogue au meilleur prix.`;
    
    seoIntro = (
      <div className="prose prose-sm max-w-none text-gray-600 mb-6">
        <p>
          Découvrez notre sélection de produits <strong>{brand.name} Algérie</strong> sur Zorando. 
          Nous proposons une gamme complète de <strong>produits {brand.name}</strong>, 
          reconnus pour leur qualité et leur fiabilité. 
          Parcourez ci-dessous toutes les <strong>catégories {brand.name}</strong> disponibles 
          pour faciliter votre quotidien. Achetez en ligne vos produits {brand.name} en toute sécurité en Algérie.
        </p>
      </div>
    );
  }
  let schemaData = [];
  if (brand.slug === 'electromenager-moulinex-algerie' && categorySlug === 'bouilloires') {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.zorando.com/" },
        { "@type": "ListItem", "position": 2, "name": "Marques", "item": "https://www.zorando.com/brands" },
        { "@type": "ListItem", "position": 3, "name": "Moulinex", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie" },
        { "@type": "ListItem", "position": 4, "name": "Bouilloires", "item": "https://www.zorando.com/brands/electromenager-moulinex-algerie/bouilloires" }
      ]
    };
    
    const productSchemas = displayedProducts.map(p => ({
      "@type": "Product",
      "name": p.name,
      "image": p.image ? (p.image.startsWith('/') ? `https://www.zorando.com${p.image}` : p.image) : undefined,
      "brand": { "@type": "Brand", "name": "Moulinex" },
      "sku": p.sku || undefined,
      "offers": {
        "@type": "Offer",
        "url": `https://www.zorando.com/product/${p.slug}`,
        "priceCurrency": "DZD",
        "price": p.promo_price || p.price,
        "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    }));
    
    schemaData = [breadcrumbSchema, ...productSchemas];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={pageTitle}
        exactTitle={true}
        description={metaDescription}
        image={brand.image}
        canonical={canonicalUrl}
        schema={schemaData.length > 0 ? schemaData : undefined}
      />
      
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-orange-500">Accueil</Link>
        <ChevronRight size={14} />
        <Link to="/brands" className="hover:text-orange-500">Marques</Link>
        <ChevronRight size={14} />
        {isCategoryPage ? (
          <>
            <Link to={`/brands/${brand.slug}`} className="hover:text-orange-500">{brand.name}</Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{currentCategory.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">{brand.name}</span>
        )}
      </div>

      {/* Brand Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {brand.image ? (
          <Link to={`/brands/${brand.slug}`} className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 hover:border-orange-200 transition-colors">
            <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-[15px]" />
          </Link>
        ) : (
          <Link to={`/brands/${brand.slug}`} className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 shrink-0 p-[15px] hover:border-orange-200 transition-colors">
            <span className="text-4xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catégories {brand.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandCategories.map(cat => (
              <div key={`${cat.level}-${cat.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{cat.name} {brand.name} Algérie</h3>
                <p className="text-sm text-gray-500 mb-4 flex-1">
                  Découvrez la gamme de {cat.name.toLowerCase()} {brand.name} disponible en Algérie.
                </p>
                <Link 
                  to={`/brands/${brand.slug}/${cat.slug}`}
                  className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700"
                >
                  Voir les {cat.name.toLowerCase()} {brand.name}
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
              {isCategoryPage ? `Tous les produits ${currentCategory.name} ${brand.name}` : `Tous les produits ${brand.name}`}
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
              <Link to={`/brands/${brand.slug}`} className="text-orange-500 hover:text-orange-600 font-medium">
                Voir tous les produits {brand.name}
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
      {bottomSeoContent}
    </div>
  );
}
