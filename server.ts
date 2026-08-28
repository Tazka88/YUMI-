import 'dotenv/config';
import express from 'express';
import { buildProductSchema, buildBreadcrumbSchema } from './src/lib/schemaUtils';
import { categorySEOData } from './src/utils/seoData';
import cors from 'cors';
import helmet from 'helmet';
import { sql, setupDb } from './src/db/setup.js';
import apiRoutes from './src/api/routes.js';
import path from 'path';
import fs from 'fs';

async function startServer() {
  console.log('Starting server...');
  
  // Non-blocking DB setup to allow health checks to pass even if DB is slow
  setupDb().then(() => {
    console.log('Database setup completed');
  }).catch(err => {
    console.error('Database setup failed:', err);
  });

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Trust proxy to handle X-Forwarded-For correctly
  app.set('trust proxy', 1);

  // Redirection explicite du favicon pour éviter le Soft 404 du SSR
  app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/favicon-zorando.svg');
  });

  // Redirect non-www to www and force HTTPS to consolidate SEO
  app.use((req, res, next) => {
    const hostname = req.hostname;
    const isHttp = req.headers['x-forwarded-proto'] === 'http';
    
    // Ignore localhost during development
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('run.app')) {
      if (hostname === 'zorando.com' || isHttp) {
        return res.redirect(301, `https://www.zorando.com${req.originalUrl}`);
      }
    }
    next();
  });

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(cors({
    origin: true, // Allow the current origin (useful for AI Studio preview)
    credentials: true
  }));
  // Removed helmet CSP to prevent iframe blocking in AI Studio preview
  // app.use(compression()); // Let Google Cloud Run/Load Balancer handle compression automatically to avoid double-compression
  app.use(express.json({ limit: '200mb' })); // Increased to 200mb for larger base64 images and videos
  app.use(express.urlencoded({ limit: '200mb', extended: true }));
  
  // Proxy Facebook Feed directly to avoid redirect issues
  app.get('/feed/meta-catalog.csv', (req, res, next) => {
    req.url = '/feed/meta-catalog.csv';
    apiRoutes(req, res, next);
  });

  // 1. API Routes (Mounted early to take precedence)
  app.use('/api', apiRoutes);

  // 2. Robots.txt - Ensuring it is correctly served to fix Facebook crawler 403
  app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.header('X-Robots-Tag', 'all');
    res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin-7xK9pL2q/

User-agent: facebookexternalhit
Allow: /

User-agent: Facebot
Allow: /

User-agent: Twitterbot
Allow: /

Sitemap: https://www.zorando.com/sitemap.xml`);
  });

  // Serve fixed static files from public
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Serve uploads statically with Cache-Control (1 year)
  app.use('/uploads', express.static(uploadsDir, { maxAge: '1y' }));

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const products = await sql`SELECT slug, created_at, is_active FROM products WHERE is_active = true`;
      const categories = await sql`SELECT slug FROM categories`;
      const subcategories = await sql`SELECT slug FROM subcategories`;
      const sub_subcategories = await sql`SELECT slug FROM sub_subcategories`;
      const brands = await sql`SELECT slug FROM brands`;
      const posts = await sql`SELECT slug, created_at FROM blog_posts WHERE status = 'published'`;
      
      const baseUrl = 'https://www.zorando.com';
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Blog
      xml += `  <url>\n    <loc>${baseUrl}/blog</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

      // Blog Posts
      posts.forEach(post => {
        const lastMod = post.created_at ? `<lastmod>${new Date(post.created_at).toISOString()}</lastmod>\n    ` : '';
        xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    ${lastMod}<changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      // Categories
      categories.forEach(cat => {
        xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      // Subcategories
      subcategories.forEach(sub => {
        xml += `  <url>\n    <loc>${baseUrl}/category/${sub.slug}?sub=true</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      });

      // Sub-subcategories
      sub_subcategories.forEach(subsub => {
        xml += `  <url>\n    <loc>${baseUrl}/category/${subsub.slug}?subsub=true</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      });

      // Brands
      xml += `  <url>\n    <loc>${baseUrl}/brands</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      brands.forEach(brand => {
        xml += `  <url>\n    <loc>${baseUrl}/brands/${brand.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });
      
      // Products
      products.forEach(prod => {
        const lastMod = prod.created_at ? `<lastmod>${new Date(prod.created_at).toISOString()}</lastmod>\n    ` : '';
        xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    ${lastMod}<changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      });
      
      xml += `</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // SEO Redirects
  const redirects: Record<string, string> = {
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
    '/blog/hoco-power-bank-en-algerie-guide-complet-prix-et-avis-2026': '/blog',
    '/brands/multismart': '/brands/electromenager-multismart-algerie',
    '/brands/nespresso': '/brands/cafe-nespresso-algerie',
    '/brands/tefal': '/brands/cuisine-tefal-algerie',
    '/brands/xiaomi': '/brands/smartphones-xiaomi-algerie',
    '/brands/bosch': '/brands/electromenager-bosch-algerie',
    '/brands/calor': '/brands/entretien-calor-algerie',
    '/brands/apple': '/brands/apple-algerie',
    '/brands/brandman': '/brands/electromenager-brandman-algerie',
    '/brands/ninja': '/brands/cuisine-ninja-algerie',
    '/brands/remington': '/brands/beaute-remington-algerie',
    '/brands/huawei': '/brands/high-tech-huawei-algerie',
    '/brands/crown': '/brands/outillage-crown-algerie',
    '/brands/silvercrest': '/brands/electromenager-silvercrest-algerie',
    '/brands/seb': '/brands/electromenager-seb-algerie',
    '/brands/uniross': '/brands/piles-uniross-algerie',
    '/brands/tirex': '/brands/electromenager-tirex-algerie',
    '/brands/sony': '/brands/high-tech-sony-algerie',
    '/brands/delonghi': '/brands/cafe-delonghi-algerie',
    '/brands/elite99': '/brands/electromenager-elite99-algerie',
    '/brands/kenwood': '/brands/cuisine-kenwood-algerie',
    '/brands/revlon': '/brands/beaute-revlon-algerie',
    '/brands/samsung': '/brands/high-tech-samsung-algerie',
    '/brands/realme': '/brands/high-tech-realme-algerie',
    '/brands/proficook': '/brands/cuisine-proficook-algerie',
    '/brands/nardi': '/brands/electromenager-nardi-algerie',
    '/brands/nike': '/brands/mode-nike-algerie',
    '/brands/lg': '/brands/high-tech-lg-algerie'
  };

  app.use(async (req, res, next) => {
    // Exact match for the path (ignores query string)
    const newUrl = redirects[req.path];
    if (newUrl) {
      // Append query string if present
      const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      return res.redirect(301, newUrl + qs);
    }

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // Disable default index.html serving
    
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

  
  const staticRedirects = {
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
      // If it looks like a static file request, let it fall through to 404
      if (req.path.match(/\.[a-zA-Z0-9]+$/) && !req.path.endsWith('.html')) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.join(distPath, 'template.html'), 'utf-8');
        let title = 'Boutique en ligne Électroménager, Mode, Beauté';
        let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';
        let keywords = 'boutique en ligne, e-commerce, Algérie, achat en ligne, électroménager, mode, beauté, maison, ZORANDO';
        const baseUrl = 'https://www.zorando.com';
        
        let reqCanonicalPath = req.path;
        if (reqCanonicalPath.length > 1 && reqCanonicalPath.endsWith('/')) {
            reqCanonicalPath = reqCanonicalPath.slice(0, -1);
        }
        
        let structuralQuery = '';
        if (req.query.sub === 'true' || req.query.subsub === 'true') {
          const params = new URLSearchParams();
          if (req.query.sub === 'true') params.set('sub', 'true');
          if (req.query.subsub === 'true') params.set('subsub', 'true');
          structuralQuery = '?' + params.toString();
        }
        
        let headHtml = `<link data-rh="true" rel="canonical" href="${baseUrl}${reqCanonicalPath}${structuralQuery}" />`;
        let seoHtml = '';
        // Prefer JPEG for Facebook if it exists
        let ogImage = `${baseUrl}/og-image-fb.jpg`;
        let ogUrl = `${baseUrl}${req.path}`;

        let isNotFound = false;

        if (req.path === '/' || req.path === '/index.html') {
          const categories = await sql`SELECT name, slug FROM categories`;
          const brands = await sql`SELECT name, slug FROM brands`;
          
          const [firstSlide] = await sql`SELECT id, image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC, id ASC LIMIT 1`;
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
          
          seoHtml = ''; // No hidden content anymore
        } else if (req.path === '/brands') {
          title = 'Toutes nos marques | Zorando';
          seoHtml = ''; // No hidden content
        } else if (req.path.startsWith('/brands/')) {
          const slug = req.path.split('/')[2];
          const [brand] = await sql`SELECT id, name, description, seo_title, seo_description, h1_title, seo_content FROM brands WHERE slug = ${slug}`;
          
          if (brand) {
            title = brand.seo_title || `${brand.name} | Zorando`;
            description = brand.seo_description ? cleanForSEO(brand.seo_description) : (brand.description ? cleanForSEO(brand.description, 160) : `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`);
            seoHtml = ''; // No hidden content
          } else {
            isNotFound = true;
          }
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
          const [product] = await sql`
            SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, 
             CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(p.brand_name, b.name) as brand_name,
            c.name as category_name,
            c.slug as category_slug,
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
            description = product.seo_description ? cleanForSEO(product.seo_description) : (product.description ? cleanForSEO(product.description, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);
            
            if (product.seo_keywords) { keywords = product.seo_keywords; }
            
            if (product.image) {
              if (product.image.startsWith('http')) {
                ogImage = product.image;
              } else if (product.image.startsWith('data:image')) {
                ogImage = `${baseUrl}/api/images/products/${product.id}/image/${slug}.webp?v=${product.image.length}`;
              } else {
                ogImage = product.image.startsWith('/') ? `${baseUrl}${product.image}` : `${baseUrl}/${product.image}`;
              }
            }
            
            // Build Server-Side JSON-LD
            const isPromo = product.promo_price !== null && product.promo_price !== undefined;
            const now = new Date();
            let isPromoValid = false;
            if (isPromo) {
                isPromoValid = true;
                if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
                if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
            }
            
            const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
            
            const reviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} AND status = 'published' ORDER BY created_at DESC`;
            
            // Note: Since API doesn't filter by published for now, I'll fetch all like the frontend:
            const allReviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
          
          const extraImages = await sql`SELECT image FROM product_images WHERE product_id = ${product.id} ORDER BY id ASC`;
          product.images = extraImages.map((img: any) => img.image);
            
            const productSchema = buildProductSchema(product, allReviews, `${baseUrl}${reqCanonicalPath}`, baseUrl);
            
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
            breadcrumbItems.push({ name: product.name, item: `${baseUrl}${reqCanonicalPath}` });
            
            const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
            
            delete productSchema["@context"];
            delete breadcrumbSchema["@context"];
            const graphSchema = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
            
            headHtml += `<meta property="og:type" content="product" />\n`;
            headHtml += `<meta name="twitter:card" content="summary_large_image" />\n`;
            headHtml += `<meta property="product:price:amount" content="${currentPrice.toFixed(2)}" />\n`;
            headHtml += `<meta property="product:price:currency" content="DZD" />\n`;
          headHtml += `<meta property="product:availability" content="${product.stock > 0 ? 'in stock' : 'out of stock'}" />\n`;
            
            const staticBody = `
              <div style="position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;" id="seo-static-content">
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
            
            seoHtml = `<script type="application/ld+json">${JSON.stringify(graphSchema)}</script>\n${staticBody}`;
          } else {
            isNotFound = true;
          }
        } else if (req.path.startsWith('/landing/')) {
          const slug = req.path.split('/')[2];
          const [landingPage] = await sql`
            SELECT lp.id, lp.slug, lp.config, p.name as product_name, p.description as product_description, p.seo_title, p.seo_description, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as product_image
            FROM landing_pages lp
            JOIN products p ON lp.product_id = p.id
            WHERE lp.slug = ${slug}
          `;
          
          if (landingPage) {
            const config = landingPage.config || {};
            title = config.seo_title || landingPage.seo_title || `${landingPage.product_name} | ZORANDO`;
            description = config.seo_description ? cleanForSEO(config.seo_description) : (landingPage.seo_description ? cleanForSEO(landingPage.seo_description) : (landingPage.product_description ? cleanForSEO(landingPage.product_description, 160) : `Découvrez ${landingPage.product_name} sur Zorando.`));
            
            if (landingPage.product_image) {
              if (landingPage.product_image.startsWith('http')) {
                ogImage = landingPage.product_image;
              } else if (landingPage.product_image.startsWith('data:image')) {
                ogImage = `${baseUrl}/api/images/products/${landingPage.product_id}/image/${slug}.webp?v=${landingPage.product_image.length}`;
              } else {
                ogImage = landingPage.product_image.startsWith('/') ? `${baseUrl}${landingPage.product_image}` : `${baseUrl}/${landingPage.product_image}`;
              }
            }
            
            seoHtml = ''; // No hidden content
          } else {
            isNotFound = true;
          }
        } else if (req.path.startsWith('/blog/')) {
          const slug = req.path.split('/')[2];
          const [post] = await sql`
            SELECT title, excerpt, seo_title, seo_description, main_image
            FROM blog_posts
            WHERE slug = ${slug} AND status = 'published'
          `;
          if (post) {
            title = post.seo_title || post.title || 'ZORANDO Blog';
            description = post.seo_description ? cleanForSEO(post.seo_description) : (post.excerpt ? cleanForSEO(post.excerpt, 160) : `Lisez notre article : ${post.title}`);
            if (post.main_image) {
              ogImage = post.main_image.startsWith('/') ? `${baseUrl}${post.main_image}` : `${baseUrl}/${post.main_image}`;
            }
          } else {
            isNotFound = true;
          }
        } else if (req.path === '/blog') {
          title = 'Blog & Actualités | Zorando';
          description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
        } else if (req.path === '/about') {
          title = 'À propos de nous | Zorando';
          description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/programme-fidelite') {
          title = 'Programme de fidélité | Zorando';
          description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/retours') {
          title = 'Politique de retours | Zorando';
          description = 'Consultez notre politique de retours et remboursements.';
          seoHtml = ''; // No hidden content
        } else if (req.path === '/track-order') {
          title = 'Suivre ma commande | Zorando';
          description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
          seoHtml = ''; // No hidden content
        }

        if (isNotFound) {
          title = 'Page Introuvable | Zorando';
          description = 'La page que vous recherchez n\'existe pas ou a été supprimée.';
          res.status(404);
        } else {
          res.status(200);
        }

        
    // Nettoyage robuste du titre
    let cleanTitle = title.replace(/\s*[-–—|]\s*ZORANDO\s*$/i, '');
    cleanTitle = cleanTitle.replace(/[-–—\s]+$/, '');
    title = cleanTitle + ' | Zorando';
    
    let seoTags = `
          <title data-rh="true">${title}</title>
          <meta data-rh="true" name="description" content="${description}" />
          ${typeof keywords !== 'undefined' && keywords ? `<meta data-rh="true" name="keywords" content="${keywords}" />` : ''}
          <meta data-rh="true" property="og:title" content="${title}" />
          <meta data-rh="true" property="og:description" content="${description}" />
          <meta data-rh="true" property="og:image" content="${typeof ogImage !== 'undefined' ? ogImage : ''}" />
          <meta data-rh="true" property="og:url" content="${typeof ogUrl !== 'undefined' ? ogUrl : ''}" />
          <meta data-rh="true" name="twitter:title" content="${title}" />
          <meta data-rh="true" name="twitter:description" content="${description}" />
          <meta data-rh="true" name="twitter:image" content="${typeof ogImage !== 'undefined' ? ogImage : ''}" />
        
          <meta data-rh="true" name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;
        
        console.log('Final title to inject:', title);
        console.log('Final title to inject:', title);
        let finalHtml = template.replace('<!--seo-injection-->', '');
        finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${typeof seoHtml !== 'undefined' ? seoHtml : ''}</div>`);
        finalHtml = finalHtml.replace('<!--head-injection-->', (typeof headHtml !== 'undefined' ? headHtml : '') + seoTags);
        
        if (isNotFound) {
          res.header('X-Robots-Tag', 'noindex, follow');
        } else {
          res.header('X-Robots-Tag', 'all');
        }
        res.header('Cache-Control', 'no-cache');
        res.send(finalHtml);
      } catch (err) {
        console.error('SEO Injection Error:', err);
        res.sendFile(path.join(distPath, 'template.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
