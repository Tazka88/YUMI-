import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import apiRoutes from '../src/api/routes.js';
import path from 'path';
import fs from 'fs';
import { sql } from '../src/db/setup.js';

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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'*'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"],
      scriptSrc: ["'*'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"],
      styleSrc: ["'*'", "'unsafe-inline'"],
      imgSrc: ["'*'", "data:", "blob:"],
      fontSrc: ["'*'", "data:"],
      connectSrc: ["'*'", "ws:", "wss:"],
      frameSrc: ["'*'"],
      mediaSrc: ["'*'", "data:", "blob:"],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(compression());
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
    const host = req.get('host') || 'zorando.com';
    const baseUrl = `https://${host}`;
    let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />`;
    let seoHtml = `
      <div id="seo-content" style="display:none;">
        <h1>${title}</h1>
        <h2>ZORANDO - Informations</h2>
        <p>${description}</p>
        <p>Page: ${req.path}</p>
      </div>
    `;
    let ogImage = `${baseUrl}/og-image-fb.jpg`;
    let ogUrl = `${baseUrl}${req.path}`;

    if (req.path === '/' || req.path === '/index.html') {
      try {
        const categories = await sql`SELECT name, slug FROM categories`;
        const brands = await sql`SELECT name, slug FROM brands`;
        headHtml = `
          <link rel="canonical" href="${baseUrl}${req.path}" />
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
          </div>
        `;
      } catch(e) {}
    } else if (req.path === '/brands') {
      title = 'Toutes nos marques - ZORANDO';
      try {
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
      } catch(e) {}
    } else if (req.path.startsWith('/brands/')) {
      const slug = req.path.split('/')[2];
      try {
        const [brand] = await sql`SELECT id, name, description FROM brands WHERE slug = ${slug}`;
        if (brand) {
          title = `${brand.name} - ZORANDO`;
          description = brand.description || `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO.`;
          const products = await sql`SELECT name, slug FROM products WHERE brand_id = ${brand.id}`;
          seoHtml = `
            <div id="seo-content" style="display:none;">
              <h1>${brand.name}</h1>
              <h2>Produits de marque ${brand.name}</h2>
              <p>${description}</p>
              <ul>
                ${products.map(p => `<li><a href="/product/${p.slug}">${p.name}</a></li>`).join('\n')}
              </ul>
            </div>
          `;
        }
      } catch(e) {}
    } else if (req.path.startsWith('/category/')) {
      const slug = req.path.split('/')[2];
      try {
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
          }
        }
      } catch(e) {}
    } else if (req.path.startsWith('/product/')) {
      const slug = req.path.split('/')[2];
      try {
        const [product] = await sql`SELECT name, description, price, promo_price FROM products WHERE slug = ${slug}`;
        if (product) {
          title = `${product.name} - ZORANDO`;
          description = product.description ? product.description.substring(0, 160) : `Achetez ${product.name} au meilleur prix sur ZORANDO.`;
          const displayPrice = product.promo_price || product.price;
          seoHtml = `
            <div id="seo-content" style="display:none;">
              <h1>${product.name}</h1>
              <h2>Achetez ${product.name} au meilleur prix</h2>
              <p>${description}</p>
              <p>Prix: ${displayPrice} DZD</p>
            </div>
          `;
        }
      } catch(e) {}
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
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.header('Cache-Control', 'no-cache');
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
