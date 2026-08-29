import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from '../src/api/routes.js';
import path from 'path';
import fs from 'fs';
import { sql } from '../src/db/setup.js';
import { categorySEOData } from '../src/utils/seoData.js';
import { buildProductSchema, buildBreadcrumbSchema } from '../src/lib/schemaUtils.js';

const app = express();

app.set('trust proxy', 1);

// Create uploads directory if it doesn't exist (ephemeral on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL;
const uploadsDir = isVercel 
  ? path.join('/tmp', 'uploads') 
  : path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// app.use(compression()); // Removed to prevent double-compression in Vercel
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir, { maxAge: '1y' }));

// API Routes
app.get('/api/sitemap.xml', (req, res, next) => {
  req.url = '/sitemap.xml';
  apiRoutes(req, res, next);
});

app.get('/api/robots.txt', (req, res, next) => {
  req.url = '/robots.txt';
  apiRoutes(req, res, next);
});

app.use('/api', apiRoutes);

// SEO Routes (passed to apiRoutes)
app.use((req, res, next) => {
  if (req.query.seo === 'sitemap') {
    req.url = '/sitemap.xml';
    return apiRoutes(req, res, next);
  }
  
  if (req.query.seo === 'robots') {
    req.url = '/robots.txt';
    return apiRoutes(req, res, next);
  }
  
// If it's just /api and no other route matched, return 404 JSON instead of HTML
  if (req.url === '/api' || req.path === '/api' || req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found API endpoint' });
  }
  
  next();
});

// Numeric Category redirect for old indexed IDs
app.use(async (req, res, next) => {
  // Dynamic redirects for numeric category IDs
  if (req.path.match(/^\/category\/\d+$/)) {
    const id = parseInt(req.path.split('/')[2]);
    try {
      let [cat] = await sql`SELECT slug FROM categories WHERE id = ${id}`;
      if (cat && cat.slug) return res.redirect(301, `/category/${cat.slug}`);

      let [subcat] = await sql`SELECT slug FROM subcategories WHERE id = ${id}`;
      if (subcat && subcat.slug) return res.redirect(301, `/category/${subcat.slug}?sub=true`);

      let [subsub] = await sql`SELECT slug FROM sub_subcategories WHERE id = ${id}`;
      if (subsub && subsub.slug) return res.redirect(301, `/category/${subsub.slug}?subsub=true`);
    } catch (err) {
      console.error('Error resolving numeric category ID:', err);
    }
  }
  next();
});

// Serve frontend with SEO injection for non-asset routes
const cleanForSEO = (text: any, truncateLength?: number) => {
  if (!text) return '';
  const maxLength = truncateLength || 155;
  let cleanText = text.replace(/<[^>]+>/g, ' ')
                    .replace(/(?:\*\*|\*|__|_|#|>|`|~)/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
  
  if (cleanText.length > maxLength) {
    let lastPoint = cleanText.substring(0, maxLength).lastIndexOf('.');
    if (lastPoint > maxLength * 0.7) {
      return cleanText.substring(0, lastPoint + 1).replace(/\.{2,}$/, '').trim();
    }
    
    let lastComma = cleanText.substring(0, maxLength).lastIndexOf(',');
    if (lastComma > maxLength * 0.7) {
      return cleanText.substring(0, lastComma).replace(/\.{2,}$/, '').trim();
    }
    
    let lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace > 0) {
      return cleanText.substring(0, lastSpace).replace(/\.{2,}$/, '').trim();
    }
    
    return cleanText.substring(0, maxLength).replace(/\.{2,}$/, '').trim();
  }
  
  return cleanText.replace(/\.{2,}$/, '').trim();
};

  
  const staticRedirects: Record<string, string> = {
    '/product/hoco-casque-sans-w45': '/product/hoco-casque-sans-fil-bluetooth-5-3-400mah-w45',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-cran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-172-pouces-bt54-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    '/brands/bestway': '/brands/piscines-bestway-algerie',
    '/brands/hoco': '/brands/accessoires-hoco-algerie',
    '/brands/kemei': '/brands/tondeuses-kemei-algerie',
    '/brands/moulinex': '/brands/electromenager-moulinex-algerie',
    '/brands/philips': '/brands/electromenager-philips-algerie',
    '/brands/robuste': '/brands/electromenager-robuste-algerie',
    '/brands/sonashi': '/brands/electromenager-sonashi-algerie',
    '/brands/anker': '/brands/accessoires-anker-algerie',
    '/brands/enzo': '/brands/coiffure-enzo-algerie',
    '/brands/karcher': '/brands/nettoyage-karcher-algerie',
    '/blog/hoco-power-bank-en-algerie-guide-complet-prix-et-avis-2026': '/blog'
  };

  app.use((req, res, next) => {
    const newUrl = staticRedirects[req.path];
    if (newUrl) {
      const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      return res.redirect(301, newUrl + qs);
    }
    next();
  });

app.get('*', async (req, res, next) => {
  // If it looks like a static file request (has extension dot), let it fall through
  if (req.path.match(/\.[a-zA-Z0-9]+$/) && !req.path.endsWith('.html')) {
    return next();
  }

  try {
    // Use string literals to help Vercel NFT trace dependencies
    const indexPath = path.join(process.cwd(), 'dist', 'template.html');
    const publicPath = path.join(process.cwd(), 'public', 'index.html');
    let template = '<html><head></head><body><h1>Missing template.html</h1></body></html>';
    
    if (fs.existsSync(indexPath)) {
      template = fs.readFileSync(indexPath, 'utf-8');
    } else if (fs.existsSync(publicPath)) {
      template = fs.readFileSync(publicPath, 'utf-8');
    }

    let title = 'ZORANDO - Boutique en ligne';
    let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';
    let keywords = 'boutique en ligne, e-commerce, Algérie, achat en ligne, électroménager, mode, beauté, maison, ZORANDO';
    const baseUrl = 'https://www.zorando.com';
    let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />\n<link rel="preload" as="font" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" type="font/woff2" crossorigin="anonymous">`;
    let seoHtml = '';
    let isNotFound = false;
    let ogImage = `${baseUrl}/og-image-fb.jpg`;
    let ogUrl = `${baseUrl}${req.path}`;

    if (req.path === '/' || req.path === '/index.html') {
      try {
        const categories = await sql`SELECT name, slug FROM categories`;
        const brands = await sql`SELECT name, slug FROM brands`;
        const [firstSlide] = await sql`SELECT id, image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC, id ASC LIMIT 1`;

        headHtml = `\n          <link rel="canonical" href="${baseUrl}${req.path}" />\n          <link rel="preload" as="font" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" type="font/woff2" crossorigin="anonymous">`;

        if (firstSlide) {
          if (firstSlide.mobile_image_url) {
            headHtml += `\n          <link rel="preload" as="image" href="${firstSlide.mobile_image_url}" media="(max-width: 767px)" fetchpriority="high">`;
          } else if (firstSlide.image_url) {
            headHtml += `\n          <link rel="preload" as="image" href="${firstSlide.image_url}" media="(max-width: 767px)" fetchpriority="high">`;
          }

          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            headHtml += `\n          <link rel="preload" as="image" href="${desktopImage}" media="(min-width: 768px)" fetchpriority="high">`;
          }
        }
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/brands') {
      title = 'Toutes nos marques | Zorando';
      try {
        const brands = await sql`SELECT name, slug FROM brands`;
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/brands/')) {
      const slug = req.path.split('/')[2];
      try {
        const [brand] = await sql`SELECT id, name, description, seo_title, seo_description FROM brands WHERE slug = ${slug}`;
        if (brand) {
          title = `${brand.name} | Zorando`;
          description = brand.seo_description ? cleanForSEO(brand.seo_description) : (brand.description ? cleanForSEO(brand.description, 160) : `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`);
          const products = await sql`SELECT name, slug FROM products WHERE brand_id = ${brand.id}`;
          seoHtml = '';
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/category/')) {
          const slug = req.path.split('/')[2];
          
          // FAST PATH: Use static SEO data first without querying the DB
          if (categorySEOData && categorySEOData[slug]) {
            title = categorySEOData[slug].title;
            description = categorySEOData[slug].description;
            if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;
            seoHtml = ''; // No hidden content
          } else {
            try {
              const [category] = await sql`SELECT id, name FROM categories WHERE slug = ${slug}`;
              if (category) {
                title = `${category.name} | ZORANDO`;
                description = `Découvrez notre sélection de produits dans la catégorie ${category.name}. Achetez au meilleur prix sur ZORANDO.`;
                seoHtml = '';
              } else {
                const [subcat] = await sql`SELECT id, name FROM subcategories WHERE slug = ${slug}`;
                if (subcat) {
                  title = `${subcat.name} | ZORANDO`;
                  description = `Découvrez notre sélection de produits dans la catégorie ${subcat.name}. Achetez au meilleur prix sur ZORANDO.`;
                  seoHtml = '';
                } else {
                  const [subSubcat] = await sql`SELECT id, name FROM sub_subcategories WHERE slug = ${slug}`;
                  if (subSubcat) {
                    title = `${subSubcat.name} | ZORANDO`;
                    description = `Découvrez notre sélection de produits dans la catégorie ${subSubcat.name}. Achetez au meilleur prix sur ZORANDO.`;
                    seoHtml = '';
                  } else {
                    isNotFound = true;
                  }
                }
              }
            } catch (err) {
              console.error("DB error for category fallback:", err);
            }
          }
        } else if (req.path.startsWith('/product/')) {
      const slug = req.path.split('/')[2];
      try {
        const [product] = await sql`
          SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
             CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(p.brand_name, b.name) as brand_name,
            c.name as category_name,
            c.slug as category_slug,
            b.name as brand_name,
            sub.name as subcategory_name,
            sub.slug as subcategory_slug,
            subsub.name as sub_subcategory_name,
            subsub.slug as sub_subcategory_slug,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
            LEFT JOIN sub_subcategories subsub ON p.sub_subcategory_id = subsub.id
            WHERE p.slug = ${slug}
        `;
        if (product) {
          title = product.seo_title || `${product.name} | Zorando`;
          if (product.seo_description) {
            description = cleanForSEO(product.seo_description);
          } else if (product.description) {
            const shortDesc = cleanForSEO(product.description, 80);
            description = `Découvrez ${product.name} sur Zorando. ${shortDesc} Commandez vite au meilleur prix !`;
            if (description.length > 160) {
              description = `Découvrez ${product.name} sur Zorando. Commandez vite au meilleur prix !`;
            }
          } else {
            description = `Achetez ${product.name} au meilleur prix sur ZORANDO.`;
          }
          if (product.seo_keywords) keywords = product.seo_keywords;
          
          if (product.image) {
            // Handle image format: Could be an external URL, base64 data, or an internal path
            if (product.image.startsWith('http')) {
              ogImage = product.image;
            } else if (product.image.startsWith('data:image')) {
              // For data URIs from the DB, we generate the API endpoint URL for the seo image
              ogImage = `${baseUrl}/api/images/products/${product.id}/image/${slug}.webp?v=${product.image.length}`;
            } else {
              ogImage = product.image.startsWith('/') ? `${baseUrl}${product.image}` : `${baseUrl}/${product.image}`;
            }
          }
          
          let isPromoValid = false;
          if (product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price)) {
              const now = new Date();
              isPromoValid = true;
              if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
              if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
          }
          
          const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
          
          const allReviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
          
          const extraImages = await sql`SELECT image FROM product_images WHERE product_id = ${product.id} ORDER BY id ASC`;
          product.images = extraImages.map((img: any) => img.image);
          
          const productSchema = buildProductSchema(product, allReviews, `${baseUrl}${req.path}`, baseUrl);
          
          const breadcrumbItems = [
            { name: 'Accueil', item: baseUrl }
          ];
          if (product.category_slug) {
            breadcrumbItems.push({ name: product.category_name || 'Catégorie', item: `${baseUrl}/category/${product.category_slug}` });
          }
          if (product.subcategory_slug) {
            breadcrumbItems.push({ name: product.subcategory_name, item: `${baseUrl}/category/${product.subcategory_slug}?sub=true` });
          }
          if (product.sub_subcategory_slug) {
            breadcrumbItems.push({ name: product.sub_subcategory_name, item: `${baseUrl}/category/${product.sub_subcategory_slug}?subsub=true` });
          }
          breadcrumbItems.push({ name: product.name, item: `${baseUrl}${req.path}` });
          
          const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
          
          delete productSchema["@context"];
          delete breadcrumbSchema["@context"];
          const schemaData = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
          
          headHtml += `\n<script type="application/ld+json">\n${JSON.stringify(schemaData)}\n</script>\n`;
          
          headHtml += `<meta property="og:type" content="product" />\n`;
          headHtml += `<meta name="twitter:card" content="summary_large_image" />\n`;
          headHtml += `<meta property="product:price:amount" content="${currentPrice.toFixed(2)}" />\n`;
          headHtml += `<meta property="product:price:currency" content="DZD" />\n`;
          headHtml += `<meta property="product:availability" content="${product.stock > 0 ? 'in stock' : 'out of stock'}" />\n`;
          
          // Inject static HTML for Googlebot in the root div (Point 1, 4, 6)
          const staticBody = `
            <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content" aria-hidden="true">
              <h1>${product.name}</h1>
              <img src="${ogImage}" alt="${product.name}" />
              <p><strong>Prix:</strong> ${currentPrice.toFixed(2)} DZD</p>
              <div>
                <h2>Description</h2>
                <div>${(product.description || description || '').replace(/\n/g, '<br />')}</div>
              </div>
              <div>
                <h2>Catégories</h2>
                <ul>
                  <li><a href="${baseUrl}/category/${product.category_slug}">${product.category_name}</a></li>
                </ul>
              </div>
            </div>
          `;
          seoHtml = staticBody;
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/blog/')) {
      const slug = req.path.split('/')[2];
      try {
        const [post] = await sql`SELECT title, excerpt, seo_title, seo_description, main_image FROM blog_posts WHERE slug = ${slug} AND status = 'published'`;
        if (post) {
          title = post.seo_title || post.title || 'ZORANDO Blog';
          description = post.seo_description ? cleanForSEO(post.seo_description) : (post.excerpt ? cleanForSEO(post.excerpt, 160) : `Lisez notre article : ${post.title}`);
          if (post.main_image) {
            ogImage = post.main_image.startsWith('/') ? `${baseUrl}${post.main_image}` : `${baseUrl}/${post.main_image}`;
          }
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/blog') {
      title = 'Blog & Actualités | Zorando';
      description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
    } else if (req.path === '/about') {
      title = 'À propos de nous | Zorando';
      description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
      seoHtml = '';
    } else if (req.path === '/programme-fidelite') {
      title = 'Programme de fidélité | Zorando';
      description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
      seoHtml = '';
    } else if (req.path === '/retours') {
      title = 'Politique de retours | Zorando';
      description = 'Consultez notre politique de retours et remboursements.';
      seoHtml = '';
    } else if (req.path === '/track-order') {
      title = 'Suivre ma commande | Zorando';
      description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
      seoHtml = '';
    }

    const globalNav = `
      <nav id="global-nav" class="sr-only">
        <a href="/">Accueil</a>
        <a href="/brands">Marques</a>
        <a href="/about">À propos</a>
        <a href="/programme-fidelite">Programme de fidélité</a>
        <a href="/retours">Retours</a>
        <a href="/track-order">Suivi de commande</a>
      </nav>
    `;

    
    if (isNotFound) {
      title = 'Page Introuvable | Zorando';
      description = 'La page que vous recherchez n\'existe pas ou a été supprimée.';
    }

    
    // Nettoyage robuste du titre
    let cleanTitle = title.replace(/\s*[-–—|]\s*ZORANDO\s*$/i, '');
    cleanTitle = cleanTitle.replace(/[-–—\s]+$/, '');
    title = cleanTitle + ' | Zorando';
    
    let seoTags = `
      <title data-rh="true">${title}</title>
      <meta data-rh="true" name="description" content="${description}" />
      ${keywords ? `<meta data-rh="true" name="keywords" content="${keywords}" />` : ''}
      <meta data-rh="true" property="og:title" content="${title}" />
      <meta data-rh="true" property="og:description" content="${description}" />
      <meta data-rh="true" property="og:image" content="${ogImage}" />
      <meta data-rh="true" property="og:url" content="${ogUrl}" />
      <meta data-rh="true" name="twitter:title" content="${title}" />
      <meta data-rh="true" name="twitter:description" content="${description}" />
      <meta data-rh="true" name="twitter:image" content="${ogImage}" />
    
      <meta data-rh="true" name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;
    
    let finalHtml = template.replace('<!--seo-injection-->', globalNav);
    finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${seoHtml || ''}</div>`);
    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml + seoTags);
    
    if (isNotFound) {
      res.header('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(404).send(finalHtml);
    } else {
      res.header('X-Robots-Tag', 'all');
      res.header('Content-Type', 'text/html; charset=utf-8');
      
      // Add Vercel Edge Cache Control for Public HTML
      if (req.method === 'GET' && (!req.headers.cookie || !req.headers.cookie.match(/session|token|auth|user/i))) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      res.status(200).send(finalHtml);
    }

  } catch (err) {
    console.error('SEO Injection Error:', err);
    res.status(500).send('Erreur lors du rendu de la page SEO');
  }
});

// Global error handler for debugging
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export the Express API for Vercel Serverless Functions
export default app;
