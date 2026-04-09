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

  // Serve uploads statically with Cache-Control (1 year)
  app.use('/uploads', express.static(uploadsDir, { maxAge: '1y' }));

  // SEO Routes
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://${req.get('host')}/sitemap.xml`);
  });

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
    
    app.get('*', async (req, res) => {
      try {
        let template = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        let seoHtml = '';
        let title = 'Yumi - Boutique en ligne';
        let description = 'Découvrez Yumi (YUMIDZ), votre boutique en ligne de confiance en Algérie.';

        if (req.path === '/' || req.path === '/index.html') {
          const categories = await sql`SELECT name, slug FROM categories`;
          const brands = await sql`SELECT name, slug FROM brands`;
          seoHtml = `
            <div id="seo-content" style="display:none;">
              <h1>Bienvenue sur Yumi - Boutique en ligne en Algérie</h1>
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
          title = 'Toutes nos marques - Yumi';
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
            title = `${brand.name} - Yumi`;
            description = brand.description || `Découvrez tous les produits de la marque ${brand.name} sur Yumi.`;
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
            title = `${category.name} - Yumi`;
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
              title = `${subcat.name} - Yumi`;
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
                title = `${subSubcat.name} - Yumi`;
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
            title = `${product.name} - Yumi`;
            description = product.description ? product.description.substring(0, 160) : `Achetez ${product.name} au meilleur prix sur Yumi.`;
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
          title = 'À propos de nous - Yumi';
          description = 'Découvrez l\'histoire de Yumi, votre boutique en ligne de confiance en Algérie.';
        } else if (req.path === '/programme-fidelite') {
          title = 'Programme de fidélité - Yumi';
          description = 'Rejoignez le programme de fidélité Yumi et profitez de récompenses exclusives.';
        } else if (req.path === '/retours') {
          title = 'Politique de retours - Yumi';
          description = 'Consultez notre politique de retours et remboursements.';
        } else if (req.path === '/track-order') {
          title = 'Suivre ma commande - Yumi';
          description = 'Suivez l\'état de votre commande Yumi en temps réel.';
        }

        let finalHtml = template.replace('<!--seo-injection-->', seoHtml);
        finalHtml = finalHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        finalHtml = finalHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
        
        res.send(finalHtml);
      } catch (err) {
        console.error('SEO Injection Error:', err);
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
