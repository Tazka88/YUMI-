import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from '../src/api/routes.js';
import path from 'path';
import fs from 'fs';
import { sql } from '../src/db/setup.js';
import { categorySEOData } from '../src/utils/seoData.js';

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
    const host = req.get('host') || 'www.zorando.com';
    const baseUrl = `https://${host}`;
    let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />`;
    let seoHtml = '';
    let ogImage = `${baseUrl}/og-image-fb.jpg`;
    let ogUrl = `${baseUrl}${req.path}`;

    if (req.path === '/' || req.path === '/index.html') {
      try {
        const categories = await sql`SELECT name, slug FROM categories`;
        const brands = await sql`SELECT name, slug FROM brands`;
        const [firstSlide] = await sql`SELECT id, image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC, id ASC LIMIT 1`;

        headHtml = `\n          <link rel="canonical" href="${baseUrl}${req.path}" />`;

        if (firstSlide) {
          const getHash = (image) => {
            if (!image) return '';
            const vMatch = image.match(/v=([^&]+)/);
            if (vMatch && vMatch[1]) return vMatch[1];
            let code = 0;
            for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
            return Math.abs(code).toString(36);
          };

          if (firstSlide.mobile_image_url) {
            const hash = getHash(firstSlide.mobile_image_url);
            const mobileUrl = `/api/images/slider_images/${firstSlide.id}/mobile_image_url${hash ? '?v=' + hash + '&' : '?'}w=640`;
            headHtml += `\n          <link rel="preload" as="image" href="${mobileUrl}" media="(max-width: 767px)" fetchpriority="high">`;
          }

          const desktopImage = firstSlide.image_url || firstSlide.mobile_image_url;
          if (desktopImage) {
            const hash = getHash(desktopImage);
            const field = firstSlide.image_url ? 'image_url' : 'mobile_image_url';
            const width = firstSlide.image_url ? 1600 : 640;
            const desktopUrl = `/api/images/slider_images/${firstSlide.id}/${field}${hash ? '?v=' + hash + '&' : '?'}w=${width}`;
            headHtml += `\n          <link rel="preload" as="image" href="${desktopUrl}" media="(min-width: 768px)" fetchpriority="high">`;
          }
        }
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/brands') {
      title = 'Toutes nos marques - ZORANDO';
      try {
        const brands = await sql`SELECT name, slug FROM brands`;
        seoHtml = '';
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/brands/')) {
      const slug = req.path.split('/')[2];
      try {
        const [brand] = await sql`SELECT id, name, description FROM brands WHERE slug = ${slug}`;
        if (brand) {
          title = `${brand.name} - ZORANDO`;
          description = brand.description || `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`;
          const products = await sql`SELECT name, slug FROM products WHERE brand_id = ${brand.id}`;
          seoHtml = '';
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
        const [product] = await sql`SELECT id, name, description, price, promo_price, image FROM products WHERE slug = ${slug}`;
        if (product) {
          title = `${product.name} - ZORANDO`;
          description = product.description ? product.description.substring(0, 160).replace(/<[^>]+>/g, '') : `Achetez ${product.name} au meilleur prix sur ZORANDO.`;
          
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
          
          const displayPrice = product.promo_price || product.price;
          seoHtml = '';
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/about') {
      title = 'À propos de nous - ZORANDO';
      description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
      seoHtml = '';
    } else if (req.path === '/programme-fidelite') {
      title = 'Programme de fidélité - ZORANDO';
      description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
      seoHtml = '';
    } else if (req.path === '/retours') {
      title = 'Politique de retours - ZORANDO';
      description = 'Consultez notre politique de retours et remboursements.';
      seoHtml = '';
    } else if (req.path === '/track-order') {
      title = 'Suivre ma commande - ZORANDO';
      description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
      seoHtml = '';
    }

    const globalNav = `
      <nav id="global-nav" style="display:none;">
        <a href="/">Accueil</a>
        <a href="/brands">Marques</a>
        <a href="/about">À propos</a>
        <a href="/programme-fidelite">Programme de fidélité</a>
        <a href="/retours">Retours</a>
        <a href="/track-order">Suivi de commande</a>
      </nav>
    `;

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
    `;
    
    let finalHtml = template.replace('<!--seo-injection-->', globalNav + seoHtml);
    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml + seoTags);
    
    res.header('X-Robots-Tag', 'all');
    res.header('Content-Type', 'text/html; charset=utf-8');
    
    // Add Vercel Edge Cache Control for Public HTML
    if (req.method === 'GET' && (!req.headers.cookie || !req.headers.cookie.match(/session|token|auth|user/i))) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
    
    res.status(200).send(finalHtml);
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
