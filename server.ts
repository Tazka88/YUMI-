import 'dotenv/config';
import express from 'express';
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
  const PORT = 3000;

  // Trust proxy to handle X-Forwarded-For correctly
  app.set('trust proxy', 1);

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
      const products = await sql`SELECT slug FROM products`;
      const categories = await sql`SELECT slug FROM categories`;
      const brands = await sql`SELECT slug FROM brands`;
      const posts = await sql`SELECT slug FROM blog_posts WHERE status = 'published'`;
      
      const baseUrl = 'https://www.zorando.com';
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Blog
      xml += `  <url>\n    <loc>${baseUrl}/blog</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;

      // Blog Posts
      posts.forEach(post => {
        xml += `  <url>\n    <loc>${baseUrl}/blog/${post.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      // Categories
      categories.forEach(cat => {
        xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      // Brands
      xml += `  <url>\n    <loc>${baseUrl}/brands</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      brands.forEach(brand => {
        xml += `  <url>\n    <loc>${baseUrl}/brands/${brand.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });
      
      // Products
      products.forEach(prod => {
        xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
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
    
    app.get('*', async (req, res, next) => {
      // If it looks like a static file request, let it fall through to 404
      if (req.path.match(/\.[a-zA-Z0-9]+$/) && !req.path.endsWith('.html')) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.join(distPath, 'template.html'), 'utf-8');
        let title = 'ZORANDO - Boutique en ligne';
        let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';
        const baseUrl = 'https://www.zorando.com';
        
        let reqCanonicalPath = req.path;
        if (reqCanonicalPath.length > 1 && reqCanonicalPath.endsWith('/')) {
            reqCanonicalPath = reqCanonicalPath.slice(0, -1);
        }
        let headHtml = `<link rel="canonical" href="${baseUrl}${reqCanonicalPath}" />`;
        let seoHtml = `
          <div id="seo-content" style="display:none;">
            <h1>${title}</h1>
            <h2>ZORANDO - Informations</h2>
            <p>${description}</p>
            <p>Page: ${req.path}</p>
          </div>
        `;
        // Prefer JPEG for Facebook if it exists
        let ogImage = `${baseUrl}/og-image-fb.jpg`;
        let ogUrl = `${baseUrl}${req.path}`;

        let isNotFound = false;

        if (req.path === '/' || req.path === '/index.html') {
          const categories = await sql`SELECT name, slug FROM categories`;
          const brands = await sql`SELECT name, slug FROM brands`;
          headHtml += `
            <link rel="preload" as="image" href="/api/hero-banners/first-image/mobile" media="(max-width: 767px)" fetchpriority="high">
            <link rel="preload" as="image" href="/api/hero-banners/first-image/desktop" media="(min-width: 768px)" fetchpriority="high">
          `;
          seoHtml = `
            <div id="seo-content" style="display:none;">
              <h1>Bienvenue sur ZORANDO - Boutique en ligne en Algérie</h1>
              <p>${description}</p>
              <h2>Nos Catégories</h2>
              <ul>
                ${categories.map(c => `<li><a href="/category/${c.slug}">${c.name}</a></li>`).join('\n')}
              </ul>
              <h2>Nos Marques</h2>
              <ul>
                ${brands.map(b => `<li><a href="/brands/${b.slug}">${b.name}</a></li>`).join('\n')}
              </ul>
              <nav>
                <a href="/about">À propos</a>
                <a href="/programme-fidelite">Programme de fidélité</a>
                <a href="/retours">Retours</a>
                <a href="/track-order">Suivi de commande</a>
              </nav>
            </div>
          `;
        } else if (req.path === '/brands') {
          title = 'Toutes nos marques - ZORANDO';
          const brands = await sql`SELECT name, slug FROM brands`;
          seoHtml = `
            <div id="seo-content" style="display:none;">
              <h1>Toutes nos marques</h1>
              <h2>Liste de toutes les marques partenaires</h2>
              <ul>
                ${brands.map(b => `<li><a href="/brands/${b.slug}">${b.name}</a></li>`).join('\n')}
              </ul>
            </div>
          `;
        } else if (req.path.startsWith('/brands/')) {
          const slug = req.path.split('/')[2];
          const [brand] = await sql`SELECT id, name, description, seo_title, seo_description, h1_title, seo_content FROM brands WHERE slug = ${slug}`;
          
          if (brand) {
            title = brand.seo_title || `${brand.name} - ZORANDO`;
            description = brand.seo_description || brand.description || `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`;
            const products = await sql`SELECT name, slug FROM products WHERE brand_id = ${brand.id}`;
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${brand.h1_title || brand.name}</h1>
                ${brand.seo_content ? brand.seo_content : ''}
                <h2>Produits de marque ${brand.name}</h2>
                <p>${description}</p>
                <ul>
                  ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                </ul>
              </div>
            `;
          } else {
            isNotFound = true;
          }
        } else if (req.path.startsWith('/category/')) {
          const slug = req.path.split('/')[2];
          const [category] = await sql`SELECT id, name, description FROM categories WHERE slug = ${slug}`;
          
          if (category) {
            title = `${category.name} - ZORANDO`;
            description = category.description || `Découvrez nos produits dans la catégorie ${category.name}.`;
            const products = await sql`SELECT name, slug FROM products WHERE category_id = ${category.id}`;
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${category.name}</h1>
                <h2>Achetez dans ${category.name}</h2>
                <p>${description}</p>
                <ul>
                  ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                </ul>
              </div>
            `;
          } else {
            const [subcat] = await sql`SELECT id, name FROM subcategories WHERE slug = ${slug}`;
            if (subcat) {
              title = `${subcat.name} - ZORANDO`;
              const products = await sql`SELECT name, slug FROM products WHERE subcategory_id = ${subcat.id}`;
              seoHtml = `
                <div id="seo-content" style="display:none;">
                  <h1>${subcat.name}</h1>
                  <h2>Produits dans la sous-catégorie ${subcat.name}</h2>
                  <ul>
                    ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                  </ul>
                </div>
              `;
            } else {
              const [subSubcat] = await sql`SELECT id, name FROM sub_subcategories WHERE slug = ${slug}`;
              if (subSubcat) {
                title = `${subSubcat.name} - ZORANDO`;
                const products = await sql`SELECT name, slug FROM products WHERE sub_subcategory_id = ${subSubcat.id}`;
                seoHtml = `
                  <div id="seo-content" style="display:none;">
                    <h1>${subSubcat.name}</h1>
                    <h2>Produits dans la section ${subSubcat.name}</h2>
                    <ul>
                      ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                    </ul>
                  </div>
                `;
              } else {
                isNotFound = true;
              }
            }
          }
        } else if (req.path.startsWith('/product/')) {
          const slug = req.path.split('/')[2];
          const [product] = await sql`SELECT id, name, description, seo_title, seo_description, seo_keywords, price, promo_price, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/products/' || id || '/image/' || slug || '.webp' ELSE image END as image FROM products WHERE slug = ${slug}`;
          
          if (product) {
            title = product.seo_title || `${product.name} - ZORANDO`;
            description = product.seo_description || (product.description ? product.description.substring(0, 160).replace(/<[^>]+>/g, '') : `Achetez ${product.name} au meilleur prix sur ZORANDO.`);
            
            if (product.seo_keywords) {
              headHtml += `<meta name="keywords" content="${product.seo_keywords}" />`;
            }
            
            if (product.image) {
              if (product.image.startsWith('http')) {
                ogImage = product.image;
              } else if (product.image.startsWith('data:image')) {
                ogImage = `${baseUrl}/api/images/products/${product.id}/image/${slug}.webp?v=${product.image.length}`;
              } else {
                ogImage = product.image.startsWith('/') ? `${baseUrl}${product.image}` : `${baseUrl}/${product.image}`;
              }
            }
            
            const displayPrice = product.promo_price || product.price;
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${product.name}</h1>
                <h2>Achetez ${product.name} au meilleur prix</h2>
                <p>${description}</p>
                <p>Prix: ${displayPrice} DZD</p>
              </div>
            `;
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
            description = config.seo_description || landingPage.seo_description || landingPage.product_description?.substring(0, 160).replace(/<[^>]+>/g, '') || `Découvrez ${landingPage.product_name} sur Zorando.`;
            
            if (landingPage.product_image) {
              if (landingPage.product_image.startsWith('http')) {
                ogImage = landingPage.product_image;
              } else if (landingPage.product_image.startsWith('data:image')) {
                ogImage = `${baseUrl}/api/images/products/${landingPage.product_id}/image/${slug}.webp?v=${landingPage.product_image.length}`;
              } else {
                ogImage = landingPage.product_image.startsWith('/') ? `${baseUrl}${landingPage.product_image}` : `${baseUrl}/${landingPage.product_image}`;
              }
            }
            
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${title}</h1>
                <p>${description}</p>
              </div>
            `;
          } else {
            isNotFound = true;
          }
        } else if (req.path === '/about') {
          title = 'À propos de nous - ZORANDO';
          description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
          seoHtml = `<div id="seo-content" style="display:none;"><h1>${title}</h1><h2>Notre Histoire</h2><p>${description}</p></div>`;
        } else if (req.path === '/programme-fidelite') {
          title = 'Programme de fidélité - ZORANDO';
          description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
          seoHtml = `<div id="seo-content" style="display:none;"><h1>${title}</h1><h2>Avantages et Récompenses</h2><p>${description}</p></div>`;
        } else if (req.path === '/retours') {
          title = 'Politique de retours - ZORANDO';
          description = 'Consultez notre politique de retours et remboursements.';
          seoHtml = `<div id="seo-content" style="display:none;"><h1>${title}</h1><h2>Conditions de Retour</h2><p>${description}</p></div>`;
        } else if (req.path === '/track-order') {
          title = 'Suivre ma commande - ZORANDO';
          description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
          seoHtml = `<div id="seo-content" style="display:none;"><h1>${title}</h1><h2>Tracking de Livraison</h2><p>${description}</p></div>`;
        }

        if (isNotFound) {
          title = 'Page Introuvable - ZORANDO';
          description = 'La page que vous recherchez n\'existe pas ou a été supprimée.';
          res.status(404);
        } else {
          res.status(200);
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

        let finalHtml = template.replace('<!--seo-injection-->', globalNav + seoHtml);
        finalHtml = finalHtml.replace('<!--head-injection-->', headHtml);
        finalHtml = finalHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        finalHtml = finalHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
        
        // Update OG Tags dynamically
        finalHtml = finalHtml.replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${title}" />`);
        finalHtml = finalHtml.replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${description}" />`);
        finalHtml = finalHtml.replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${ogImage}" />`);
        finalHtml = finalHtml.replace(/<meta property="og:url" content=".*?" \/>/g, `<meta property="og:url" content="${ogUrl}" />`);
        finalHtml = finalHtml.replace(/<meta name="twitter:title" content=".*?" \/>/g, `<meta name="twitter:title" content="${title}" />`);
        finalHtml = finalHtml.replace(/<meta name="twitter:description" content=".*?" \/>/g, `<meta name="twitter:description" content="${description}" />`);
        finalHtml = finalHtml.replace(/<meta name="twitter:image" content=".*?" \/>/g, `<meta name="twitter:image" content="${ogImage}" />`);
        
        res.header('X-Robots-Tag', 'all');
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
