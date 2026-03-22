import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { sql } from './src/db/setup.js';
import apiRoutes from './src/api/routes.js';
import path from 'path';
import fs from 'fs';

async function startServer() {
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
  app.use(helmet({
    crossOriginResourcePolicy: false, // Allow loading images from other origins if needed
    contentSecurityPolicy: false, // Disable CSP for preview environment compatibility
  }));
  app.use(compression()); // Compress all HTTP responses (Gzip/Brotli)
  app.use(express.json({ limit: '5mb' })); // Reduced from 50mb to prevent DoS
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

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
      
      const baseUrl = `https://${req.get('host')}`;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Categories
      categories.forEach(cat => {
        xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
