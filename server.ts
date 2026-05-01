import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { sql, setupDb } from './src/db/setup.ts';
import apiRoutes from './src/api/routes.ts';
import path from 'path';
import fs from 'fs';

async function startServer() {
  await setupDb();
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
  // Removed helmet to prevent iframe blocking in AI Studio preview
  app.use(compression()); // Compress all HTTP responses (Gzip/Brotli)
  app.use(express.json({ limit: '15mb' })); // Increased to 15mb for larger base64 images
  app.use(express.urlencoded({ limit: '15mb', extended: true }));
  
  // 1. Robots.txt - Ensuring it is correctly served to fix Facebook crawler 403
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

Sitemap: https://zorando.com/sitemap.xml`);
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
      
      const baseUrl = `https://${req.get('host')}`;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
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

  // API Routes
  app.use('/api', apiRoutes);

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
        const host = req.get('host') || 'zorando.com';
        const baseUrl = `https://${host}`;
        let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />`;
        let seoHtml = `
          <div id="seo-content" style="display:none;">
            <h1>${title}</h1>
            <p>${description}</p>
            <p>Page: ${req.path}</p>
          </div>
        `;
        // Prefer JPEG for Facebook if it exists
        let ogImage = `${baseUrl}/og-image-fb.jpg`;
        let ogUrl = `${baseUrl}${req.path}`;

        if (req.path === '/' || req.path === '/index.html') {
          const categories = await sql`SELECT name, slug FROM categories`;
          const brands = await sql`SELECT name, slug FROM brands`;
          headHtml = `
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
              <ul>
                ${brands.map(b => `<li><a href="/brands/${b.slug}">${b.name}</a></li>`).join('\n')}
              </ul>
            </div>
          `;
        } else if (req.path.startsWith('/brands/')) {
          const slug = req.path.split('/')[2];
          const [brand] = await sql`SELECT id, name, description FROM brands WHERE slug = ${slug}`;
          
          if (brand) {
            title = `${brand.name} - ZORANDO`;
            description = brand.description || `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`;
            const products = await sql`SELECT name, slug FROM products WHERE brand_id = ${brand.id}`;
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${brand.name}</h1>
                <p>${description}</p>
                <ul>
                  ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                </ul>
              </div>
            `;
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
                    <ul>
                      ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
                    </ul>
                  </div>
                `;
              }
            }
          }
        } else if (req.path.startsWith('/product/')) {
          const slug = req.path.split('/')[2];
          const [product] = await sql`SELECT name, description, price, promo_price FROM products WHERE slug = ${slug}`;
          
          if (product) {
            title = `${product.name} - ZORANDO`;
            description = product.description ? product.description.substring(0, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`;
            const displayPrice = product.promo_price || product.price;
            seoHtml = `
              <div id="seo-content" style="display:none;">
                <h1>${product.name}</h1>
                <p>${description}</p>
                <p>Prix: ${displayPrice} DZD</p>
              </div>
            `;
          }
        } else if (req.path === '/about') {
          title = 'À propos de nous - ZORANDO';
          description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
        } else if (req.path === '/programme-fidelite') {
          title = 'Programme de fidélité - ZORANDO';
          description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
        } else if (req.path === '/retours') {
          title = 'Politique de retours - ZORANDO';
          description = 'Consultez notre politique de retours et remboursements.';
        } else if (req.path === '/track-order') {
          title = 'Suivre ma commande - ZORANDO';
          description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
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
        res.status(200).send(finalHtml);
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
