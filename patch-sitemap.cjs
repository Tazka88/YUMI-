const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldSitemapBlock = /app\.get\('\/sitemap\.xml', async \(req, res\) => \{[\s\S]*?xml \+= \`<\/urlset>\`;\s*res\.header\('Content-Type', 'application\/xml'\);\s*res\.send\(xml\);\s*\} catch \(error\) \{[\s\S]*?res\.status\(500\)\.send\('Error generating sitemap'\);\s*\}/;

const newSitemapBlock = `app.get('/sitemap.xml', async (req, res) => {
    try {
      const products = await sql\`SELECT slug, created_at, is_active FROM products WHERE is_active = true\`;
      const categories = await sql\`SELECT slug FROM categories\`;
      const brands = await sql\`SELECT slug FROM brands\`;
      const posts = await sql\`SELECT slug, created_at FROM blog_posts WHERE status = 'published'\`;
      
      const baseUrl = 'https://www.zorando.com';
      
      let xml = \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\`;
      
      // Home
      xml += \`  <url>\\n    <loc>\${baseUrl}/</loc>\\n    <changefreq>daily</changefreq>\\n    <priority>1.0</priority>\\n  </url>\\n\`;
      
      // Blog
      xml += \`  <url>\\n    <loc>\${baseUrl}/blog</loc>\\n    <changefreq>daily</changefreq>\\n    <priority>0.9</priority>\\n  </url>\\n\`;

      // Blog Posts
      posts.forEach(post => {
        const lastMod = post.created_at ? \`<lastmod>\${new Date(post.created_at).toISOString()}</lastmod>\\n    \` : '';
        xml += \`  <url>\\n    <loc>\${baseUrl}/blog/\${post.slug}</loc>\\n    \${lastMod}<changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      });

      // Categories
      categories.forEach(cat => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/category/\${cat.slug}</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      });

      // Brands
      xml += \`  <url>\\n    <loc>\${baseUrl}/brands</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      brands.forEach(brand => {
        xml += \`  <url>\\n    <loc>\${baseUrl}/brands/\${brand.slug}</loc>\\n    <changefreq>weekly</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n\`;
      });
      
      // Products
      products.forEach(prod => {
        const lastMod = prod.created_at ? \`<lastmod>\${new Date(prod.created_at).toISOString()}</lastmod>\\n    \` : '';
        xml += \`  <url>\\n    <loc>\${baseUrl}/product/\${prod.slug}</loc>\\n    \${lastMod}<changefreq>weekly</changefreq>\\n    <priority>0.9</priority>\\n  </url>\\n\`;
      });
      
      xml += \`</urlset>\`;
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }`;

code = code.replace(oldSitemapBlock, newSitemapBlock);
fs.writeFileSync('server.ts', code);
