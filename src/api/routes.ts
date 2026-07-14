import { Router } from 'express';
import { sql } from '../db/setup.js';
import { getSupabase } from '../lib/supabase.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminNotificationEmail, sendContactEmail } from '../lib/email.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import capiRoutes from './capi.js';
import dhdRoutes from './dhd.js';

// Ensure profiles table has commune column
sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commune VARCHAR(255)`.catch(err => console.error('Failed to add commune to profiles:', err));

const router = Router();

// ==========================================
// GLOBAL MEMORY CACHE (Vercel optimization)
// ==========================================
const MEMORY_CACHE = new Map<string, { value: any, expires: number }>();

const getCache = (key: string) => {
  const item = MEMORY_CACHE.get(key);
  if (item && item.expires > Date.now()) return item.value;
  if (item) MEMORY_CACHE.delete(key);
  return null;
};

const setCache = (key: string, value: any, ttlMin = 15) => {
  MEMORY_CACHE.set(key, { value, expires: Date.now() + ttlMin * 60 * 1000 });
};

export const clearCache = (prefix?: string) => {
  if (!prefix) {
    MEMORY_CACHE.clear();
  } else {
    for (const key of MEMORY_CACHE.keys()) {
      if (key.startsWith(prefix)) MEMORY_CACHE.delete(key);
    }
  }
};

// Cache Control Middleware for Public Data (Vercel CDN)
router.use((req, res, next) => {
  if (req.method === 'GET') {
    const isPrivate = req.path.startsWith('/admin') || 
                      req.path.startsWith('/orders') || 
                      req.path.startsWith('/user') || 
                      req.path.startsWith('/cart');
                      
    const hasAuthCookie = req.headers.cookie && req.headers.cookie.match(/session|token|auth|user/i);

    if (!isPrivate && !hasAuthCookie) {
      // Very aggressive CDN cache for unauthenticated public requests
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=60');
      res.setHeader('CDN-Cache-Control', 'max-age=60');
    }
  } else if (req.path.startsWith('/admin/')) {
    // Bust global memory cache on any admin mutation
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      clearCache();
    }
  }
  next();
});

// Mount CAPI routes (renamed to app-events to bypass adblockers)
router.use('/app-events/v1', capiRoutes);

// Mount DHD routes
router.use('/delivery', dhdRoutes);


// Helper to process images to avoid Vercel 4.5MB payload limit
const processImage = (table: string, id: number | string, field: string, image: string | null, slug?: string) => {
  if (!image) return null;
  if (image.startsWith('/api/images/')) return image;
  
  let hash = '';
  if (image.startsWith('data:image/')) {
    // Create a simple hash from the base64 string to bust cache when image changes
    hash = image.substring(image.length - 20).replace(/[^a-zA-Z0-9]/g, '');
  } else {
    const vMatch = image.match(/v=([^&]+)/);
    if (vMatch && vMatch[1]) {
      hash = vMatch[1];
    } else {
      let code = 0;
      for (let i = 0; i < image.length; i++) code = Math.imul(31, code) + image.charCodeAt(i) | 0;
      hash = Math.abs(code).toString(36);
    }
  }
  const seoPart = slug ? `/${slug}.webp` : '';
  return `/api/images/${table}/${id}/${field}${seoPart}?v=${hash}`;
};

let sharp: any = null;
const getSharp = async () => {
  if (sharp) return sharp;
  try {
    sharp = (await import('sharp')).default;
    return sharp;
  } catch (e) {
    console.error('Failed to load sharp:', e);
    return null;
  }
};

// Helper to serve image data directly without CPU intensive sharp usage or Regex at runtime
const serveImageData = async (res: any, imageData: string, targetWidth?: number, cacheControl = 'public, max-age=31536000, immutable') => {
  if (imageData.startsWith('data:image/')) {
    // Avoid RegExp on potentially megabytes of base64 data to save Active CPU
    const commaIndex = imageData.indexOf(',');
    const extStart = 11; // 'data:image/'.length
    const extEnd = imageData.indexOf(';', extStart);
    
    if (commaIndex !== -1 && extEnd !== -1) {
      const ext = imageData.substring(extStart, extEnd);
      const base64Data = imageData.substring(commaIndex + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', `image/${ext === 'svg+xml' ? 'svg+xml' : ext}`);
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=31536000, immutable');
      res.setHeader('CDN-Cache-Control', 'max-age=31536000, immutable');
      
      return res.send(buffer);
    }
  }
  
  // Proxy external URLs so Vercel Edge can cache them and save Supabase Egress
  if (imageData.startsWith('http') || imageData.startsWith('https')) {
    try {
      const resp = await fetch(imageData);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/webp');
        res.setHeader('Cache-Control', cacheControl);
        // Instruct Vercel Edge to cache this for 30 days
        res.setHeader('Vercel-CDN-Cache-Control', 'max-age=31536000, immutable');
        res.setHeader('CDN-Cache-Control', 'max-age=31536000, immutable');
        return res.send(Buffer.from(arrayBuffer));
      } else if (resp.status === 402) {
        // Supabase specific Error for Egress Quota Exceeded
        console.warn('Supabase Quota Exceeded for URL:', imageData);
        // Serve a simple placeholder so layout doesn't break
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=60'); // Don't cache the error for long
        return res.send(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><path d="M150 150 L250 250 M250 150 L150 250" stroke="#d1d5db" stroke-width="4" stroke-linecap="round"/><rect width="180" height="140" x="110" y="130" fill="none" stroke="#d1d5db" stroke-width="4" rx="10"/></svg>`);
      }
    } catch (err) {
      console.warn('Proxy fetch failed, falling back to redirect:', err);
    }
    // Fallback directly
    res.setHeader('Cache-Control', cacheControl);
    return res.redirect(301, imageData);
  }

  // Local paths fallback
  if (imageData.startsWith('/')) {
    res.setHeader('Cache-Control', cacheControl);
    return res.redirect(301, imageData);
  }
  
  res.status(404).json({ error: 'Invalid image format' });
};

const PRODUCT_COLS = `p.id, p.category_id, p.subcategory_id, p.sub_subcategory_id, p.brand_id, p.name, p.slug, p.description, p.price, p.promo_price, p.stock, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || COALESCE(NULLIF(p.slug, ''), 'product') || '.webp?v=' || LENGTH(p.image) ELSE p.image END as image, p.main_image_alt, p.video_url, p.is_popular, p.is_best_seller, p.is_new, p.is_recommended, p.is_fast_delivery, p.weight, p.is_active, p.features, p.key_points, p.faq_q1, p.faq_a1, p.faq_q2, p.faq_a2, p.variations, p.created_at, p.seo_title, p.seo_description, p.seo_keywords`;
const PRODUCT_LIST_COLS = `p.id, p.category_id, p.subcategory_id, p.sub_subcategory_id, p.brand_id, p.name, p.slug, p.price, p.promo_price, p.stock, p.is_fast_delivery, p.is_popular, p.is_best_seller, p.is_new, p.is_recommended, p.is_active, p.variations, p.created_at, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || COALESCE(NULLIF(p.slug, ''), 'product') || '.webp?v=' || LENGTH(p.image) ELSE p.image END as image`;
const BLOG_POSTS_COLS = `id, category_id, title, slug, excerpt, content, CASE WHEN image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || id || '/image_url?v=' || LENGTH(image_url) ELSE image_url END as image_url, status, published_at, created_at, seo_title, seo_description`;
const BLOG_POSTS_LIST_COLS = `p.id, p.category_id, p.title, p.slug, p.excerpt, CASE WHEN p.image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_url?v=' || LENGTH(p.image_url) ELSE p.image_url END as image_url, p.status, p.published_at, p.created_at`;
const PRODUCT_IMAGES_COLS = `id, product_id, is_main, alt_text, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/product_images/' || id || '/image?v=' || LENGTH(image) ELSE image END as image`;
const CATEGORIES_COLS = `id, name, slug, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/categories/' || id || '/image/' || COALESCE(NULLIF(slug, ''), 'category') || '.webp?v=' || LENGTH(image) ELSE image END as image, CASE WHEN slide_image LIKE 'data:image/%' THEN '/api/images/categories/' || id || '/slide_image/' || COALESCE(NULLIF(slug, ''), 'category') || '-slide.webp?v=' || LENGTH(slide_image) ELSE slide_image END as slide_image, CASE WHEN mobile_slide_image LIKE 'data:image/%' THEN '/api/images/categories/' || id || '/mobile_slide_image/' || COALESCE(NULLIF(slug, ''), 'category') || '-mobile-slide.webp?v=' || LENGTH(mobile_slide_image) ELSE mobile_slide_image END as mobile_slide_image`;
const SLIDER_IMAGES_COLS = `id, category_id, position, is_active, title, description, button_text, button_link, created_at, CASE WHEN image_url LIKE 'data:image/%' THEN '/api/images/slider_images/' || id || '/image_url?v=' || LENGTH(image_url) ELSE image_url END as image_url, CASE WHEN mobile_image_url LIKE 'data:image/%' THEN '/api/images/slider_images/' || id || '/mobile_image_url?v=' || LENGTH(mobile_image_url) ELSE mobile_image_url END as mobile_image_url`;
const BRANDS_COLS = `id, name, slug, description, seo_title, seo_description, h1_title, seo_content, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/brands/' || id || '/image/' || COALESCE(NULLIF(slug, ''), 'brand') || '.webp?v=' || LENGTH(image) ELSE image END as image`;
const SUBCAT_COLS = `id, category_id, name, slug, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/subcategories/' || id || '/image/' || COALESCE(NULLIF(slug, ''), 'subcategory') || '.webp?v=' || LENGTH(image) ELSE image END as image`;
const SUB_SUBCAT_COLS = `id, subcategory_id, name, slug, CASE WHEN image LIKE 'data:image/%' THEN '/api/images/sub_subcategories/' || id || '/image/' || COALESCE(NULLIF(slug, ''), 'subsubcategory') || '.webp?v=' || LENGTH(image) ELSE image END as image`;

// Route to serve images from the database
router.get(['/images/:table/:id/:field', '/images/:table/:id/:field/:seoSlug'], async (req, res) => {
  const { table, id, field } = req.params;
  
  // Validate table and field to prevent SQL injection
  const allowedTables = ['products', 'categories', 'subcategories', 'sub_subcategories', 'brands', 'product_images', 'settings', 'slider_images', 'blog_posts', 'blog_categories', 'reviews'];
  const allowedFields = ['image', 'value', 'image_url', 'slide_image', 'mobile_slide_image', 'mobile_image_url'];
  
  if (!allowedTables.includes(table) || !allowedFields.includes(field)) {
    return res.status(400).json({ error: 'Invalid table or field' });
  }

  try {
    let query;
    if (table === 'settings') {
      query = `SELECT ${field} FROM ${table} WHERE key = '${id}'`;
    } else {
      query = `SELECT ${field} FROM ${table} WHERE id = ${id}`;
    }
    const result = await sql.unsafe(query);
    
    if (!result || result.length === 0 || !result[0][field]) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageData = result[0][field];
    const width = parseInt(req.query.w as string);
    
    await serveImageData(res, imageData, width);

  } catch (err) {
    console.error('Error serving image:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get the first hero banner image directly (for LCP optimization)
router.get('/hero-banners/first-image/:type', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  const { type } = req.params;
  try {
    const sliderImages = await sql`SELECT image_url, mobile_image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC LIMIT 1`;
    if (!sliderImages || sliderImages.length === 0) {
      return res.status(404).send('Not found');
    }
    
    const firstSlide = sliderImages[0];
    const field = type === 'mobile' && firstSlide.mobile_image_url ? 'mobile_image_url' : 'image_url';
    const imageData = firstSlide[field];
    
    if (!imageData) {
      return res.status(404).send('Not found');
    }
    
    const width = type === 'mobile' ? 640 : 1600;
    // Serve with short cache, or no cache if it's updated frequently. Let's use 5 minutes for performance but freshness
    await serveImageData(res, imageData, width, 'public, max-age=300');
    
  } catch (err) {
    console.error('Error serving first hero banner:', err);
    res.status(500).send('Error');
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'zorando-secret-key-123';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'zorando-secret-key-123') {
  console.error('CRITICAL ERROR: Default JWT_SECRET is used in production! Please set JWT_SECRET in Vercel.');
  // We don't exit the process to avoid crashing completely, but we log a critical error.
}


// Rate Limiter for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard.' }
});

// Rate Limiter for Orders
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de commandes passées récemment. Veuillez patienter.' }
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg|avif|heic|heif|mp4|webm|mov|avi/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('video/');

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images et les vidéos sont autorisées !'));
    }
  }
});

export const authenticate = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  // Try Supabase Auth first if configured
  const supabase = getSupabase();
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user && !error) {
      req.user = { id: user.id, username: user.email };
      return next();
    }
  }

  // Fallback to local JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ---
router.post('/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  // Try Supabase Auth first if configured
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    });
    
    if (data?.session) {
      return res.json({ token: data.session.access_token });
    }
    // If Supabase login fails (e.g. user not migrated yet), we fall through to local DB
  }

  // Fallback to local DB
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${username}`;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PUBLIC ROUTES ---
router.get('/robots.txt', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  const baseUrl = 'https://www.zorando.com';
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin-7xK9pL2q/

User-agent: facebookexternalhit
Allow: /

User-agent: Facebot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`);
});

router.get('/sitemap.xml', async (req, res) => {
  const cacheKey = 'sitemap_xml';
  const cached = getCache(cacheKey);
  if (cached) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached);
  }

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const baseUrl = 'https://www.zorando.com';
    
    const [products, categories, brands, pages] = await Promise.all([
      sql`SELECT slug, created_at FROM products`,
      sql`SELECT slug FROM categories`,
      sql`SELECT slug FROM brands`,
      sql`SELECT slug, updated_at FROM pages`
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    products.forEach(p => {
      xml += `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${new Date(p.created_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    categories.forEach(c => {
      xml += `
  <url>
    <loc>${baseUrl}/category/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    brands.forEach(b => {
      xml += `
  <url>
    <loc>${baseUrl}/brands/${b.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    pages.forEach(p => {
      const slug = p.slug.startsWith('/') ? p.slug.substring(1) : p.slug;
      xml += `
  <url>
    <loc>${baseUrl}/${slug}</loc>
    <lastmod>${new Date(p.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    setCache(cacheKey, xml, 60 * 24); // Cache for 24h as it builds on all pages
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    console.error('Sitemap error:', err);
    res.status(500).send(err.message || 'Internal Server Error');
  }
});

router.get('/pages', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const pages = await sql`SELECT id, title, slug, content, created_at, updated_at FROM pages`;
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/pages/:slug', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const [page] = await sql`SELECT * FROM pages WHERE slug = ${req.params.slug}`;
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const cacheKey = 'global_settings';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    // Settings specific CDN caching policy
    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate=300');
    const settings = await sql`SELECT "key", CASE WHEN value LIKE 'data:image/%' THEN '/api/images/settings/' || "key" || '/value?v=' || LENGTH(value) ELSE value END as value FROM settings WHERE "key" != 'admin_email'`;
    const settingsObj = settings.reduce((acc: any, setting: any) => {
      let val = setting.value;
      if (setting.key === 'site_logo' || setting.key.startsWith('theme_image_')) {
        val = processImage('settings', setting.key, 'value', val);
      }
      acc[setting.key] = val;
      return acc;
    }, {});
    
    setCache(cacheKey, settingsObj, 60); // Cache for 60 mins globally
    res.json(settingsObj);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message, stack: err.stack });
  }
});

router.get('/footer-links', async (req, res) => {
  try {
    const cacheKey = 'footer_links';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate=300');
    const links = await sql`SELECT * FROM footer_links ORDER BY column_id ASC, order_index ASC`;
    setCache(cacheKey, links, 60);
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch footer links' });
  }
});

router.get('/hero-banners', async (req, res) => {
  const cacheKey = 'hero_banners';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate=300');
    const sliderImages = await sql`SELECT ${sql.unsafe(SLIDER_IMAGES_COLS)} FROM slider_images ORDER BY position ASC`;
    
    sliderImages.forEach((s: any) => {
      s.image_url = processImage('slider_images', s.id, 'image_url', s.image_url);
      if (s.mobile_image_url) {
        s.mobile_image_url = processImage('slider_images', s.id, 'mobile_image_url', s.mobile_image_url);
      }
    });
    
    // Using s-maxage set at start of request
    setCache(cacheKey, sliderImages, 60);
    res.json(sliderImages);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slider images' });
  }
});

router.post('/hero-banners', authenticate, async (req, res) => {
  const { image_url, mobile_image_url, category_id, position, is_active, title, description, button_text, button_link } = req.body;
  try {
    const [newSliderImage] = await sql`
      INSERT INTO slider_images (image_url, mobile_image_url, category_id, position, is_active, title, description, button_text, button_link)
      VALUES (${image_url}, ${mobile_image_url || null}, ${category_id || null}, ${position || 0}, ${is_active !== undefined ? is_active : true}, ${title || null}, ${description || null}, ${button_text || null}, ${button_link || null})
      RETURNING *
    `;
    res.status(201).json(newSliderImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create slider image' });
  }
});

router.put('/hero-banners/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { image_url, mobile_image_url, category_id, position, is_active, title, description, button_text, button_link } = req.body;
  
  const isImageNew = image_url && !image_url.startsWith('/api/images/');
  const isMobileImageNew = mobile_image_url && !mobile_image_url.startsWith('/api/images/');
  
  try {
    let setClause = sql`
      category_id = ${category_id !== undefined ? category_id : sql`category_id`},
      position = COALESCE(${position}, position),
      is_active = COALESCE(${is_active}, is_active),
      title = ${title !== undefined ? title : sql`title`},
      description = ${description !== undefined ? description : sql`description`},
      button_text = ${button_text !== undefined ? button_text : sql`button_text`},
      button_link = ${button_link !== undefined ? button_link : sql`button_link`}
    `;

    if (isImageNew) {
      setClause = sql`${setClause}, image_url = ${image_url}`;
    }
    
    // If mobile_image_url is explicitly provided (even as null or empty string), update it
    // if it's a new image or if it's being removed.
    if (mobile_image_url === null || mobile_image_url === '') {
      setClause = sql`${setClause}, mobile_image_url = NULL`;
    } else if (isMobileImageNew) {
      setClause = sql`${setClause}, mobile_image_url = ${mobile_image_url}`;
    }

    const [updatedSliderImage] = await sql`
      UPDATE slider_images
      SET ${setClause}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!updatedSliderImage) return res.status(404).json({ error: 'Slider image not found' });
    res.json(updatedSliderImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slider image' });
  }
});

router.delete('/hero-banners/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM slider_images WHERE id = ${id}`;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slider image' });
  }
});

router.put('/hero-banners/reorder', authenticate, async (req, res) => {
  const { items } = req.body; // Array of { id, position }
  try {
    for (const item of items) {
      await sql`UPDATE slider_images SET position = ${item.position} WHERE id = ${item.id}`;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder slider images' });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const cacheKey = 'brands_all';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate=300');
    const brands = await sql`SELECT ${sql.unsafe(BRANDS_COLS)} FROM brands ORDER BY name ASC`;
    
    brands.forEach((b: any) => {
      b.image = processImage('brands', b.id, 'image', b.image);
    });
    setCache(cacheKey, brands, 60);
    res.json(brands);

  } catch (err: any) {
    console.error('Failed to fetch brands:', err);
    res.status(500).json({ error: 'Failed to fetch brands', details: err.message, stack: err.stack });
  }
});

router.get('/brands/:slug', async (req, res) => {
  const cacheKey = `brand_${req.params.slug}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const [brand] = await sql`SELECT ${sql.unsafe(BRANDS_COLS)} FROM brands WHERE slug = ${req.params.slug}`;
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    
    brand.image = processImage('brands', brand.id, 'image', brand.image);
    setCache(cacheKey, brand, 60);
    res.json(brand);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const cacheKey = 'categories_all';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    res.setHeader('Cache-Control', 'max-age=0, s-maxage=60, stale-while-revalidate=300');
    const categories = await sql`SELECT ${sql.unsafe(CATEGORIES_COLS)} FROM categories`;
    const subcategories = await sql`SELECT ${sql.unsafe(SUBCAT_COLS)} FROM subcategories`;
    const sub_subcategories = await sql`SELECT ${sql.unsafe(SUB_SUBCAT_COLS)} FROM sub_subcategories`;
    
    const categoriesWithSubcats = categories.map((cat: any) => ({
      ...cat,
      subcategories: subcategories.filter((sub: any) => sub.category_id?.toString() === cat.id?.toString()).map((sub: any) => ({
        ...sub,
        sub_subcategories: sub_subcategories.filter((ss: any) => ss.subcategory_id?.toString() === sub.id?.toString())
      }))
    }));
    
    
    categoriesWithSubcats.forEach((c: any) => {
      c.image = processImage('categories', c.id, 'image', c.image);
      c.slide_image = processImage('categories', c.id, 'slide_image', c.slide_image);
      if (c.mobile_slide_image) {
        c.mobile_slide_image = processImage('categories', c.id, 'mobile_slide_image', c.mobile_slide_image);
      }
      if (c.subcategories && Array.isArray(c.subcategories)) {
        c.subcategories.forEach((sub: any) => {
          sub.image = processImage('subcategories', sub.id, 'image', sub.image);
          if (sub.sub_subcategories && Array.isArray(sub.sub_subcategories)) {
            sub.sub_subcategories.forEach((ss: any) => {
              ss.image = processImage('sub_subcategories', ss.id, 'image', ss.image);
            });
          }
        });
      }
    });
    
    // Using s-maxage set at start of request
    setCache(cacheKey, categoriesWithSubcats, 60);
    res.json(categoriesWithSubcats);

  } catch (err: any) {
    console.error('Failed to fetch categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories', details: err.message, stack: err.stack });
  }
});

router.get('/subcategories', async (req, res) => {
  const cacheKey = 'subcategories_all';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const subcategories = await sql`SELECT ${sql.unsafe(SUBCAT_COLS)} FROM subcategories`;
    
    subcategories.forEach((s: any) => {
      s.image = processImage('subcategories', s.id, 'image', s.image);
    });
    setCache(cacheKey, subcategories, 60);
    res.json(subcategories);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

router.get('/products', async (req, res) => {
  const cacheKey = `products_${req.url}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  const category = req.query.category as string | undefined;
  const subcategory = req.query.subcategory as string | undefined;
  const sub_subcategory = req.query.sub_subcategory as string | undefined;
  const brand = req.query.brand as string | undefined;
  const search = req.query.search as string | undefined;
  const popular = req.query.popular || req.query.trending === 'true' ? 'true' : undefined;
  const best_seller = req.query.best_seller || req.query.top_sales === 'true' ? 'true' : undefined;
  const isNew = req.query.new as string | undefined;
  const recommended = req.query.recommended as string | undefined;
  const special_offers = req.query.special_offers || req.query.promo_active === 'true' ? 'true' : undefined;
  const ids = req.query.ids as string | undefined;
  const sort = req.query.sort as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const page = req.query.page ? Number(req.query.page) : 1;
  const offset = Math.max(0, (page - 1) * limit);
  
  try {
    const idArray = ids ? ids.split(',').map(id => Number(id)).filter(id => !isNaN(id)) : [];
    
    let orderClause = sql`ORDER BY p.created_at DESC`;
    if (sort === 'newest') {
      orderClause = sql`ORDER BY p.created_at DESC`;
    } else if (sort === 'bestsellers' || sort === 'top_sales') {
      orderClause = sql`ORDER BY p.sales_count DESC NULLS LAST, p.created_at DESC`;
    } else if (sort === 'popular' || sort === 'trending') {
      orderClause = sql`ORDER BY p.views_count DESC NULLS LAST, p.created_at DESC`;
    } else if (sort === 'random') {
      orderClause = sql`ORDER BY RANDOM()`;
    }

    const products = await sql`
      SELECT ${sql.unsafe(PRODUCT_LIST_COLS)}, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, CASE WHEN b.image LIKE 'data:image/%' THEN '/api/images/brands/' || b.id || '/image?v=' || LENGTH(b.image) ELSE b.image END as brand_image,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
      (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE 
        p.is_active = true
        AND (${category || null}::text IS NULL OR p.category_id = (SELECT id FROM categories WHERE slug = ${category || null} OR id = ${Number(category) || 0} LIMIT 1) OR p.subcategory_id IN (SELECT id FROM subcategories WHERE category_id = (SELECT id FROM categories WHERE slug = ${category || null} OR id = ${Number(category) || 0} LIMIT 1)) OR p.sub_subcategory_id IN (SELECT id FROM sub_subcategories WHERE subcategory_id IN (SELECT id FROM subcategories WHERE category_id = (SELECT id FROM categories WHERE slug = ${category || null} OR id = ${Number(category) || 0} LIMIT 1))))
        AND (${subcategory || null}::text IS NULL OR p.subcategory_id = (SELECT id FROM subcategories WHERE slug = ${subcategory || null} OR id = ${Number(subcategory) || 0} LIMIT 1) OR p.sub_subcategory_id IN (SELECT id FROM sub_subcategories WHERE subcategory_id = (SELECT id FROM subcategories WHERE slug = ${subcategory || null} OR id = ${Number(subcategory) || 0} LIMIT 1)))
        AND (${sub_subcategory || null}::text IS NULL OR p.sub_subcategory_id = (SELECT id FROM sub_subcategories WHERE slug = ${sub_subcategory || null} OR id = ${Number(sub_subcategory) || 0} LIMIT 1))
        AND (${brand || null}::text IS NULL OR p.brand_id = (SELECT id FROM brands WHERE slug = ${brand || null} OR id = ${Number(brand) || 0} LIMIT 1))
        AND (${search || null}::text IS NULL OR p.name ILIKE ${search ? '%' + search + '%' : null})
        AND (${popular === 'true' ? true : null}::boolean IS NULL OR p.is_popular = true)
        AND (${best_seller === 'true' ? true : null}::boolean IS NULL OR p.is_best_seller = true)
        AND (${isNew === 'true' ? true : null}::boolean IS NULL OR p.is_new = true)
        AND (${recommended === 'true' ? true : null}::boolean IS NULL OR p.is_recommended = true)
        AND (${special_offers === 'true' ? true : null}::boolean IS NULL OR p.promo_price IS NOT NULL)
        AND (${idArray.length > 0 ? sql`p.id = ANY(${idArray})` : sql`true`})
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    products.forEach(p => {
      try {
        p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      } catch (e) {
        // Keep as string if it can't be parsed
      }
      try {
        p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
      } catch (e) {
        // Keep as string if it can't be parsed
      }
      try {
        p.variations = typeof p.variations === 'string' ? JSON.parse(p.variations) : (p.variations || []);
        if (Array.isArray(p.variations)) {
          p.variations.forEach((v) => { if (v && v.stock !== undefined) { v.stock = Number(v.stock) || 0; } });
        }
      } catch (e) {
        p.variations = [];
      }
    });

    
    products.forEach((p: any) => {
      p.image = processImage('products', p.id, 'image', p.image);
      if (p.brand_image) p.brand_image = processImage('brands', p.brand_id, 'image', p.brand_image);
      if (p.images && Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          img.image = processImage('product_images', img.id, 'image', img.image);
        });
      }
    });
    
    setCache(cacheKey, products, 60);
    // Use the s-maxage headers set at route begin
    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products/:id/view', async (req, res) => {
  try {
    await sql`UPDATE products SET views_count = COALESCE(views_count, 0) + 1 WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/products/:slug', async (req, res) => {
  const cacheKey = `product_${req.params.slug}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    const [product] = await sql`
      SELECT ${sql.unsafe(PRODUCT_COLS)}, c.name as category_name, c.slug as category_slug, s.name as subcategory_name, s.slug as subcategory_slug, ss.name as sub_subcategory_name, ss.slug as sub_subcategory_slug, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, CASE WHEN b.image LIKE 'data:image/%' THEN '/api/images/brands/' || b.id || '/image?v=' || LENGTH(b.image) ELSE b.image END as brand_image,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
      (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN sub_subcategories ss ON p.sub_subcategory_id = ss.id
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.slug = ${req.params.slug} AND p.is_active = true
    `;
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    try {
      product.features = typeof product.features === 'string' ? JSON.parse(product.features) : (product.features || []);
    } catch (e) {
      // Keep as string if it can't be parsed
    }
    try {
      product.key_points = typeof product.key_points === 'string' ? JSON.parse(product.key_points) : (product.key_points || []);
    } catch (e) {
      // Keep as string if it can't be parsed
    }
    try {
      product.variations = typeof product.variations === 'string' ? JSON.parse(product.variations) : (product.variations || []);
      if (Array.isArray(product.variations)) {
        product.variations.forEach((v) => { if (v && v.stock !== undefined) { v.stock = Number(v.stock) || 0; } });
      }
      if (Array.isArray(product.variations)) {
        product.variations.forEach((v: any) => { if (v && v.stock !== undefined) v.stock = Number(v.stock) || 0; });
      }
    } catch (e) {
      product.variations = [];
    }

    const images = await sql`SELECT ${sql.unsafe(PRODUCT_IMAGES_COLS)} FROM product_images WHERE product_id = ${product.id}`;
    product.images = images.filter((img: any) => !img.is_main);
    const mainImgRow = images.find((img: any) => img.is_main);
    product.main_image_alt = product.main_image_alt || (mainImgRow ? (mainImgRow.alt_text || '') : '');
    
    product.image = processImage('products', product.id, 'image', product.image);
    if (product.brand_image) product.brand_image = processImage('brands', product.brand_id, 'image', product.brand_image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        img.image = processImage('product_images', img.id, 'image', img.image);
      });
    }
    
    setCache(cacheKey, product, 60);
    res.json(product);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.get('/products/:slug/reviews', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const [product] = await sql`SELECT id FROM products WHERE slug = ${req.params.slug}`;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const reviews = await sql`SELECT id, product_id, customer_name, rating, comment, CASE WHEN image_url LIKE 'data:image/%' THEN '/api/images/reviews/' || id || '/image_url?v=' || LENGTH(image_url) ELSE image_url END as image_url, created_at, status FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/products/:slug/reviews', async (req, res) => {
  const { customer_name, rating, comment, image_url } = req.body;
  
  if (typeof customer_name !== 'string' || customer_name.length > 100) return res.status(400).json({ error: 'Nom invalide' });
  if (typeof comment !== 'string' || comment.length > 1000) return res.status(400).json({ error: 'Commentaire trop long' });
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ error: 'Note invalide' });
  if (image_url && typeof image_url !== 'string') return res.status(400).json({ error: 'Image URL invalide' });

  try {
    const [product] = await sql`SELECT id FROM products WHERE slug = ${req.params.slug}`;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await sql`INSERT INTO reviews (product_id, customer_name, rating, comment, image_url) VALUES (${product.id}, ${customer_name}, ${rating}, ${comment}, ${image_url || null})`;
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// --- CUSTOMER ORDERS ---
router.get('/orders/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const orders = await sql`
      SELECT o.id, o.created_at, o.status, o.total_amount, o.delivery_cost, o.stop_desk_cost, o.delivery_type, o.shipping_address, o.shipping_wilaya, o.shipping_commune, o.shipping_office, o.payment_method, o.customer_name, o.customer_email, o.customer_phone, o.customer_phone2, o.source, o.is_pixel_tracked, 
      (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', oi.id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price, 'image', CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/product.webp' ELSE p.image END))
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = o.id) as items
      FROM orders o 
      WHERE o.customer_user_id = ${userId}
      ORDER BY o.created_at DESC
    `;
    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/orders', orderLimiter, async (req, res) => {
  const { customer_name, customer_email, customer_phone, wilaya, commune, address, note, items, delivery_cost: clientDeliveryCost, customer_user_id, stop_desk, office_id } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
  }

  try {
    let calculatedTotal = 0;
    let itemCount = 0;
    
    const validatedItems = [];
    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) throw new Error('Quantité invalide');
      
      const [product] = await sql`SELECT price, promo_price, stock, variations FROM products WHERE id = ${item.product_id}`;
      if (!product) throw new Error(`Produit invalide: ${item.product_id}`);
      
      let parsedVariations: any[] = [];
      if (typeof product.variations === 'string') {
        try { parsedVariations = JSON.parse(product.variations); } catch(e) {}
      } else if (Array.isArray(product.variations)) {
        parsedVariations = product.variations;
      }
      
      let actualPrice = product.promo_price || product.price;
      
      // Calculate active variation price if selected
      if (item.variation && parsedVariations.length > 0) {
         const matchingVariation = parsedVariations.find((v: any) => `${v.attribute} : ${v.value}` === item.variation);
         if (matchingVariation) {
            if (matchingVariation.price) {
               actualPrice = Number(matchingVariation.price);
            }
            const vStock = Number(matchingVariation.stock);
            if (!isNaN(vStock) && vStock < quantity) {
                if (vStock === 0) {
                   throw new Error(`La variation ${item.variation} est en rupture de stock`);
                } else {
                   throw new Error(`Stock insuffisant pour la variation ${item.variation} (reste ${vStock})`);
                }
            }
         }
      } else {
          const pStock = Number(product.stock);
          if (!isNaN(pStock) && pStock < quantity) {
              if (pStock === 0) {
                  throw new Error('Ce produit est en rupture de stock');
              } else {
                  throw new Error(`Stock insuffisant pour le produit ID: ${item.product_id}`);
              }
          }
      }
      
      itemCount += quantity;
      calculatedTotal += actualPrice * quantity;
      validatedItems.push({ ...item, price: actualPrice, quantity, variation: item.variation || null });
    }

    // Apply free shipping rule: subtotal >= 10000 AND itemCount >= 3
    let delivery_cost = typeof clientDeliveryCost === 'number' && clientDeliveryCost >= 0 ? clientDeliveryCost : 600;
    if (calculatedTotal >= 10000 && itemCount >= 3) {
      delivery_cost = 0;
    }

    calculatedTotal += delivery_cost;

    const orderData = await sql.begin(async (sql: any) => {
      const [order] = await sql`
        INSERT INTO orders (customer_name, customer_email, customer_phone, wilaya, commune, address, note, total_amount, delivery_cost, customer_user_id, stop_desk, office_id)
        VALUES (${customer_name || ''}, ${customer_email || null}, ${customer_phone || ''}, ${wilaya || ''}, ${commune || ''}, ${address || ''}, ${note || null}, ${calculatedTotal}, ${delivery_cost}, ${customer_user_id || null}, ${stop_desk ? true : false}, ${office_id || null})
        RETURNING id
      `;
      
      const generatedOrderId = `CMD-${1000 + order.id}`;
      await sql`UPDATE orders SET order_id = ${generatedOrderId} WHERE id = ${order.id}`;
      
      // Persist customer email in subscribers table if provided
      if (customer_email) {
        await sql`
          INSERT INTO subscribers (email, name, phone, source)
          VALUES (${customer_email.toLowerCase()}, ${customer_name || null}, ${customer_phone || null}, 'Commande')
          ON CONFLICT (email) DO UPDATE SET 
            name = COALESCE(EXCLUDED.name, subscribers.name),
            phone = COALESCE(EXCLUDED.phone, subscribers.phone),
            source = CASE WHEN subscribers.source = 'Newsletter' THEN 'Commande' ELSE subscribers.source END
        `;
      }
      
      for (const item of validatedItems) {
        if (item.variation) {
          const result = await sql`
            UPDATE products 
            SET 
              stock = stock - ${item.quantity}, 
              sales_count = COALESCE(sales_count, 0) + ${item.quantity},
              variations = (
                SELECT jsonb_agg(
                  CASE
                    WHEN (v->>'attribute') || ' : ' || (v->>'value') = ${item.variation} THEN
                      jsonb_set(
                        v, 
                        '{stock}', 
                        to_jsonb(GREATEST(COALESCE((v->>'stock')::numeric, 0) - ${item.quantity}, 0))
                      )
                    ELSE v
                  END
                )
                FROM jsonb_array_elements(
                  CASE 
                    WHEN jsonb_typeof(variations) = 'string' THEN (variations#>>'{}')::jsonb
                    WHEN jsonb_typeof(variations) = 'array' THEN variations
                    ELSE '[]'::jsonb
                  END
                ) as v
              )
            WHERE id = ${item.product_id} AND stock >= ${item.quantity}
          `;
          if (result.count === 0) {
            throw new Error(`Stock insuffisant pour le produit ID: ${item.product_id}`);
          }
        } else {
          const result = await sql`
            UPDATE products SET stock = stock - ${item.quantity}, sales_count = COALESCE(sales_count, 0) + ${item.quantity} WHERE id = ${item.product_id} AND stock >= ${item.quantity}
          `;
          if (result.count === 0) {
            throw new Error(`Stock insuffisant pour le produit ID: ${item.product_id}`);
          }
        }
        await sql`
          INSERT INTO order_items (order_id, product_id, quantity, price, variation)
          VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price}, ${item.variation})
        `;
      }
      return { id: order.id, order_id: generatedOrderId };
    });
    
    const [adminEmailSetting] = await sql`SELECT value FROM settings WHERE key = 'admin_email'`;
    if (adminEmailSetting && adminEmailSetting.value) {
      sendAdminNotificationEmail(adminEmailSetting.value, orderData.order_id, customer_name, customer_email, customer_phone, calculatedTotal, items);
    }

    if (customer_email) {
      sendOrderConfirmationEmail(orderData.order_id, customer_name, customer_email, calculatedTotal);
    }
    
    res.status(201).json({ id: orderData.id, order_id: orderData.order_id, message: 'Order created successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create order' });
  }
});

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: 'Nom invalide' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide' });
  if (typeof message !== 'string' || message.length > 2000) return res.status(400).json({ error: 'Message trop long' });
  
  try {
    const [adminEmailSetting] = await sql`SELECT value FROM settings WHERE key = 'admin_email'`;
    if (adminEmailSetting && adminEmailSetting.value) {
      sendContactEmail(adminEmailSetting.value, name, email, message);
    }
    res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- ADMIN ROUTES ---
router.post('/admin/pages', authenticate, async (req, res) => {
  const { title, slug, content } = req.body;
  try {
    const [result] = await sql`INSERT INTO pages (title, slug, content) VALUES (${title || ''}, ${slug || ''}, ${content || ''}) RETURNING id`;
    res.json({ id: result.id, title, slug, content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.put('/admin/pages/:id', authenticate, async (req, res) => {
  const { title, slug, content } = req.body;
  try {
    await sql`UPDATE pages SET title = ${title || ''}, slug = ${slug || ''}, content = ${content || ''}, updated_at = CURRENT_TIMESTAMP WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/admin/pages/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM pages WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

router.get('/admin/settings', authenticate, async (req, res) => {
  try {
    const settings = await sql`SELECT "key", CASE WHEN value LIKE 'data:image/%' THEN '/api/images/settings/' || "key" || '/value?v=' || LENGTH(value) ELSE value END as value FROM settings`;
    const settingsObj = settings.reduce((acc: any, setting: any) => {
      let val = setting.value;
      if (setting.key === 'site_logo' || setting.key.startsWith('theme_image_')) {
        val = processImage('settings', setting.key, 'value', val);
      }
      acc[setting.key] = val;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/admin/credentials', authenticate, async (req: any, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Mot de passe actuel requis' });
  }

  try {
    const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    if (newUsername && newPassword) {
      const hash = bcrypt.hashSync(newPassword, 10);
      await sql`UPDATE users SET email = ${newUsername}, password = ${hash} WHERE id = ${userId}`;
    } else if (newUsername) {
      await sql`UPDATE users SET email = ${newUsername} WHERE id = ${userId}`;
    } else if (newPassword) {
      const hash = bcrypt.hashSync(newPassword, 10);
      await sql`UPDATE users SET password = ${hash} WHERE id = ${userId}`;
    }
    res.json({ success: true, message: 'Identifiants mis à jour avec succès' });
  } catch (err: any) {
    if (err.code === '23505') { // Postgres unique violation
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
  }
});

router.post('/admin/settings', authenticate, async (req, res) => {
  const settings = req.body;
  
  if (settings.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.admin_email)) {
    return res.status(400).json({ error: 'Format d\'email invalide' });
  }
  
  try {
    await sql.begin(async (sql: any) => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          if (typeof value === 'string' && value.startsWith('/api/images/')) {
            continue;
          }
          await sql`INSERT INTO settings (key, value) VALUES (${key}, ${String(value)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
        }
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.post('/admin/footer-links', authenticate, async (req, res) => {
  const { name, url, column_id, order_index } = req.body;
  try {
    const [info] = await sql`INSERT INTO footer_links (name, url, column_id, order_index) VALUES (${name || ''}, ${url || ''}, ${column_id || null}, ${order_index || 0}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Link created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

router.put('/admin/footer-links/reorder', authenticate, async (req, res) => {
  const { links } = req.body;
  try {
    await sql.begin(async (sql: any) => {
      for (const link of links) {
        await sql`UPDATE footer_links SET order_index = ${link.order_index || 0}, column_id = ${link.column_id || null} WHERE id = ${link.id}`;
      }
    });
    res.json({ message: 'Links reordered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder links' });
  }
});

router.put('/admin/footer-links/:id', authenticate, async (req, res) => {
  const { name, url, column_id, order_index } = req.body;
  try {
    await sql`UPDATE footer_links SET name = ${name || ''}, url = ${url || ''}, column_id = ${column_id || null}, order_index = ${order_index || 0} WHERE id = ${req.params.id}`;
    res.json({ message: 'Link updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update link' });
  }
});

router.delete('/admin/footer-links/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM footer_links WHERE id = ${req.params.id}`;
    res.json({ message: 'Link deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

router.post('/reviews/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Check file size (5MB limit) already handled by multer if we configure it, but we can double check
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size too large (max 5MB)' });
  }
  
  try {
    let buffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let ext = req.file.originalname.split('.').pop() || 'bin';

    if (req.file.mimetype !== 'image/svg+xml' && !req.file.mimetype.startsWith('video/')) {
      try {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(req.file.buffer)
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        contentType = 'image/webp';
        ext = 'webp';
      } catch (sharpError) {
        console.warn('Sharp compression failed, using original file:', sharpError);
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('images');
        if (bucketError && (bucketError.message.includes('not found') || bucketError.message.includes('does not exist') || (bucketError as any).status === 404 || bucketError.name === 'StorageApiError')) {
          await supabase.storage.createBucket('images', { public: true });
        }

        const fileName = `reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, buffer, {
            contentType,
            cacheControl: 'public, max-age=31536000, immutable',
            upsert: false
          });

        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        return res.json({ url: publicUrlData.publicUrl });
      } catch (supabaseError) {
        console.error('Supabase upload failed, falling back to base64:', supabaseError);
        // Fallback to base64 below
      }
    }

    // Fallback to base64 if Supabase is not configured or fails
    const base64 = buffer.toString('base64');
    res.json({ url: `data:${contentType};base64,${base64}` });
  } catch (err) {
    console.error('Upload Error explicitly caught:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/admin/upload', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    let buffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let ext = req.file.originalname.split('.').pop() || 'bin';

    if (req.file.mimetype !== 'image/svg+xml' && !req.file.mimetype.startsWith('video/')) {
      try {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(req.file.buffer)
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        contentType = 'image/webp';
        ext = 'webp';
      } catch (sharpError) {
        console.warn('Sharp compression failed, using original file:', sharpError);
      }
    }

    // If Supabase is configured, upload to Storage
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Ensure bucket exists
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('images');
        if (bucketError && (bucketError.message.includes('not found') || bucketError.message.includes('does not exist') || (bucketError as any).status === 404 || bucketError.name === 'StorageApiError')) {
          console.log('Bucket "images" not found, creating it...');
          await supabase.storage.createBucket('images', { public: true });
        }
        
        const customName = req.body.customName ? req.body.customName.replace(/[^a-z0-9-]/g, '') : '';
        const uniqueId = Math.random().toString(36).substring(7);
        const fileName = customName 
          ? `${customName}-${uniqueId}.${ext}`
          : `${Date.now()}-${uniqueId}.${ext}`;
        
        const { data, error } = await supabase.storage
          .from('images') // The user must create this bucket in Supabase
          .upload(fileName, buffer, {
            contentType,
            cacheControl: 'public, max-age=31536000, immutable',
            upsert: false
          });

        if (error) {
          throw error;
        }

        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        return res.json({ url: publicUrlData.publicUrl });
      } catch (supabaseError) {
        console.error('Supabase upload error, falling back to base64:', supabaseError);
        // Fallback to base64 below
      }
    }

    // Fallback to base64 if Supabase is not configured
    const base64 = buffer.toString('base64');
    res.json({ url: `data:${contentType};base64,${base64}` });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const [totalOrders] = await sql`SELECT COUNT(*) as count FROM orders`;
    const [totalRevenue] = await sql`SELECT SUM(total_amount) as total FROM orders WHERE status = 'livrée'`;
    const [lowStock] = await sql`SELECT COUNT(*) as count FROM products WHERE stock < 5`;
    res.json({
      orders: totalOrders.count,
      revenue: totalRevenue.total || 0,
      lowStock: lowStock.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post('/subscribers', async (req, res) => {
  const { email, source } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  try {
    await sql`
      INSERT INTO subscribers (email, source) 
      VALUES (${email}, ${source || 'discount_offer'})
      ON CONFLICT (email) DO NOTHING
    `;
    res.json({ message: 'Inscription réussie' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

router.get('/admin/emails', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const offset = (pageNum - 1) * limitNum;

    // We can compute the full list in a subquery and select from it with offset
    const query = sql`
      FROM (
        SELECT DISTINCT ON (LOWER(email)) 
          email, name, phone, source, created_at 
        FROM (
          SELECT customer_email as email, customer_name as name, customer_phone as phone, 'Commande' as source, created_at 
          FROM orders 
          WHERE customer_email IS NOT NULL AND customer_email != ''
          UNION ALL
          SELECT email, name, phone, source, created_at 
          FROM subscribers
          UNION ALL
          SELECT email, CONCAT(first_name, ' ', last_name) as name, phone, 'Compte Client' as source, created_at 
          FROM profiles
          WHERE email IS NOT NULL AND email != ''
        ) combined
        ORDER BY LOWER(email), created_at DESC
      ) distinct_emails
    `;
    
    const [{count}] = await sql`SELECT COUNT(*) as count ${query}`;

    const emails = await sql`
      SELECT * ${query}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    res.json({ emails, totalCount: Number(count) });
  } catch (err) {
    console.error('Failed to fetch emails:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.get('/admin/email-logs', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const offset = (pageNum - 1) * limitNum;

    const [{count}] = await sql`SELECT COUNT(*) as count FROM email_logs`;
    
    const logs = await sql`SELECT id, email, subject, status, created_at, error, opened_at, clicked_at FROM email_logs ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    
    res.json({ logs, totalCount: Number(count) });
  } catch (err) {
    console.error('Failed to fetch email logs:', err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

router.get('/admin/orders', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = sql`WHERE 1=1`;
    if (status && status !== 'all') {
      whereClause = sql`WHERE o.status = ${status as string}`;
    }
    
    if (search) {
      const searchStr = `%${search as string}%`;
      const searchFilter = sql`(o.order_id ILIKE ${searchStr} OR o.customer_name ILIKE ${searchStr} OR o.customer_phone ILIKE ${searchStr} OR o.id::text ILIKE ${searchStr})`;
      if (status && status !== 'all') {
         whereClause = sql`${whereClause} AND ${searchFilter}`;
      } else {
         whereClause = sql`WHERE ${searchFilter}`;
      }
    }

    const [totalCount] = await sql`SELECT COUNT(*) as count FROM orders o ${whereClause}`;

    const orders = await sql`
      SELECT o.id, o.order_id, o.created_at, o.status, o.total_amount, o.delivery_cost, o.address, o.wilaya, o.commune, o.office_id, o.stop_desk, o.customer_name, o.customer_email, o.customer_phone, o.note, o.customer_user_id,
      (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'variation', oi.variation, 'status', oi.status, 'product_name', p.name, 'product_image', CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/product.webp' ELSE p.image END))
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = o.id) as items
      FROM orders o 
      ${whereClause}
      ORDER BY o.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    res.json({ orders, totalCount: Number(totalCount?.count) || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/admin/orders/:id', authenticate, async (req, res) => {
  try {
    const [order] = await sql`SELECT * FROM orders WHERE id = ${req.params.id}`;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const items = await sql`
      SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, oi.variation, oi.status, p.name as product_name, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/product.webp' ELSE p.image END as product_image 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ${req.params.id}
    `;
    
    items.forEach((item: any) => {
      if (item.product_image) {
        item.product_image = processImage('products', item.product_id, 'image', item.product_image);
      }
    });
    
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

router.put('/admin/orders/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const [order] = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${req.params.id}
      RETURNING order_id, customer_name, customer_email
    `;
    
    if (order && order.customer_email) {
      sendOrderStatusEmail(order.order_id, order.customer_name, order.customer_email, status);
    }
    
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.put('/admin/orders/:orderId/items/:itemId/status', authenticate, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    await sql.begin(async (sql: any) => {
      const [item] = await sql`SELECT * FROM order_items WHERE id = ${req.params.itemId} AND order_id = ${req.params.orderId}`;
      if (!item) throw new Error('Order item not found');
      
      const oldStatus = item.status || 'active';
      if (oldStatus === status) return; // No change

      await sql`UPDATE order_items SET status = ${status} WHERE id = ${req.params.itemId}`;

      // Recalculate order total
      let priceChange = 0;
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        // We cancelled the item, subtract its price
        priceChange = -(item.price * item.quantity);
        
        // Restore stock
        if (item.product_id) {
            await sql`UPDATE products SET stock = stock + ${item.quantity}, sales_count = GREATEST(0, COALESCE(sales_count, 0) - ${item.quantity}) WHERE id = ${item.product_id}`;
        }
      } else if (status !== 'cancelled' && oldStatus === 'cancelled') {
        // We un-cancelled the item, add its price back 
        priceChange = (item.price * item.quantity);
        
        // Deduct stock again
        if (item.product_id) {
            await sql`UPDATE products SET stock = GREATEST(0, stock - ${item.quantity}), sales_count = COALESCE(sales_count, 0) + ${item.quantity} WHERE id = ${item.product_id}`;
        }
      }

      if (priceChange !== 0) {
        await sql`UPDATE orders SET total_amount = GREATEST(0, total_amount + ${priceChange}) WHERE id = ${req.params.orderId}`;
      }
    });

    res.json({ message: 'Order item status updated' });
  } catch (err) {
    console.error('Failed to update order item status:', err);
    res.status(500).json({ error: 'Failed to update order item status', details: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/orders/:id', authenticate, async (req, res) => {
  try {
    await sql.begin(async (sql: any) => {
      await sql`DELETE FROM order_items WHERE order_id = ${req.params.id}`;
      await sql`DELETE FROM orders WHERE id = ${req.params.id}`;
    });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

router.get('/admin/products', authenticate, async (req, res) => {
  try {
    const { search, page = '1', limit = '20', category_id, brand_id, max_price } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(sql`(p.name ILIKE ${searchTerm} OR p.description ILIKE ${searchTerm} OR p.id::text ILIKE ${searchTerm} OR p.sku ILIKE ${searchTerm})`);
    }

    if (category_id) {
      conditions.push(sql`p.category_id = ${parseInt(category_id as string)}`);
    }

    if (brand_id) {
      conditions.push(sql`p.brand_id = ${parseInt(brand_id as string)}`);
    }

    if (max_price) {
      conditions.push(sql`p.price <= ${parseFloat(max_price as string)}`);
    }

    const whereClause = conditions.length > 0 
      ? sql`WHERE ${conditions.reduce((acc, curr, idx) => idx === 0 ? curr : sql`${acc} AND ${curr}`, sql``)}`
      : sql``;

    const [totalCount] = await sql`
      SELECT COUNT(*) as count 
      FROM products p
      ${whereClause}
    `;

    const products = await sql`
      SELECT ${sql.unsafe(PRODUCT_LIST_COLS)}, c.name as category_name, s.name as subcategory_name, ss.name as sub_subcategory_name, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN sub_subcategories ss ON p.sub_subcategory_id = ss.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    

    products.forEach((p: any) => {
      try {
        p.variations = typeof p.variations === 'string' ? JSON.parse(p.variations) : (p.variations || []);
        if (Array.isArray(p.variations)) {
          p.variations.forEach((v) => { if (v && v.stock !== undefined) { v.stock = Number(v.stock) || 0; } });
        }
      } catch (e) {
        p.variations = [];
      }
      p.image = processImage('products', p.id, 'image', p.image);
      if (p.brand_image) p.brand_image = processImage('brands', p.brand_id, 'image', p.brand_image);
    });

    res.json({
      products,
      total: parseInt(totalCount.count),
      page: pageNum,
      totalPages: Math.ceil(parseInt(totalCount.count) / limitNum)
    });

  } catch (err) {
    console.error('Failed to fetch admin products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/admin/products/:id', authenticate, async (req, res) => {
  try {
    const [product] = await sql`
      SELECT ${sql.unsafe(PRODUCT_COLS)}, c.name as category_name, s.name as subcategory_name, ss.name as sub_subcategory_name, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN sub_subcategories ss ON p.sub_subcategory_id = ss.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = ${req.params.id}
    `;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const images = await sql`SELECT ${sql.unsafe(PRODUCT_IMAGES_COLS)} FROM product_images WHERE product_id = ${product.id}`;
    
    product.images = images.filter((img: any) => !img.is_main);
    const mainImgRow = images.find((img: any) => img.is_main);
    product.main_image_alt = product.main_image_alt || (mainImgRow ? (mainImgRow.alt_text || '') : '');
    
    product.image = processImage('products', product.id, 'image', product.image);
    product.images.forEach((img: any) => { img.image = processImage('product_images', img.id, 'image', img.image); });

    try { product.features = typeof product.features === 'string' ? JSON.parse(product.features) : (product.features || []); } catch(e){}
    try { product.key_points = typeof product.key_points === 'string' ? JSON.parse(product.key_points) : (product.key_points || []); } catch(e){}
    try { 
      product.variations = typeof product.variations === 'string' ? JSON.parse(product.variations) : (product.variations || []);
      if (Array.isArray(product.variations)) product.variations.forEach((v: any) => { if (v && v.stock !== undefined) v.stock = Number(v.stock) || 0; });
    } catch(e) { product.variations = []; }
    
    res.json(product);
  } catch (err) {
    console.error('Failed to fetch admin product detail:', err);
    res.status(500).json({ error: 'Failed to fetch admin product detail' });
  }
});

router.get('/admin/export-meta-catalog', authenticate, async (req, res) => {
  try {
    const products = await sql`
      SELECT ${sql.unsafe(PRODUCT_COLS)}, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id
    `;

    const exportedProducts = products.filter((p: any) => p.image && typeof p.image === 'string' && p.image.trim() !== '');
    const ignoredCount = products.length - exportedProducts.length;

    // CSV Header
    const columns = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
    
    // Helper to format CSV fields strictly
    const formatField = (field: any, forceQuote = false) => {
      if (field === null || field === undefined) return forceQuote ? '""' : '';
      let str = String(field).trim();
      // Remove all newlines and replace with space, remove multiple spaces
      str = str.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
      
      if (forceQuote || str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const baseUrl = req.protocol + '://' + req.get('host');
    
    const rows = exportedProducts.map((p: any) => {
      const id = formatField(p.id);
      const title = formatField(String(p.name).substring(0, 200), true);
      
      // Description: normal text, no ALL CAPS
      let rawDesc = p.description || p.name || '';
      let descriptionText = rawDesc.toLowerCase().replace(/(^\w|\.\s+\w)/g, (letter: string) => letter.toUpperCase());
      const description = formatField(descriptionText, true);
      
      const availability = p.is_active !== false ? 'in stock' : 'out of stock';
      const condition = 'new';
      
      const priceVal = p.promo_price > 0 ? p.promo_price : p.price;
      const price = `${Number(priceVal).toFixed(2)} DZD`;
      
      const link = `${baseUrl}/product/${p.slug}`;
      
      // Image: no base64, specific format
      const vMatch = p.image.match(/(\?v=[^&]+)/);
      const vParam = vMatch ? vMatch[1] : '';
      const seoSlug = p.slug ? `/${p.slug}.webp` : '';
      const image_link = `${baseUrl}/api/images/products/${p.id}/image${seoSlug}${vParam}`;
      
      const brand = formatField(p.brand_name || 'Generic');

      return [id, title, description, availability, condition, price, link, image_link, brand].join(',');
    });

    const csvContent = [columns.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
    res.setHeader('X-Exported-Count', exportedProducts.length.toString());
    res.setHeader('X-Ignored-Count', ignoredCount.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Exported-Count, X-Ignored-Count');
    res.send(csvContent);
  } catch (err) {
    console.error('Failed to export meta catalog:', err);
    res.status(500).json({ error: 'Failed to export meta catalog' });
  }
});

const META_PRODUCT_COLS = `p.id, p.name, p.slug, SUBSTRING(p.description FROM 1 FOR 300) as description, p.price, p.promo_price, p.is_active, CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || COALESCE(NULLIF(p.slug, ''), 'product') || '.webp?v=' || LENGTH(p.image) ELSE p.image END as image`;

// Public endpoint for Meta catalog scheduled fetch
router.get('/feed/meta-catalog.csv', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  
  const cacheKey = 'meta_catalog_csv';
  const cached = getCache(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
    return res.status(200).send(Buffer.from(cached));
  }

  try {
    const products = await sql`
      SELECT ${sql.unsafe(META_PRODUCT_COLS)}, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id
    `;

    const exportedProducts = products.filter((p: any) => p.image && typeof p.image === 'string' && p.image.trim() !== '');

    // CSV Header
    const columns = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
    
    // Helper to format CSV fields strictly
    const formatField = (field: any, forceQuote = false) => {
      if (field === null || field === undefined) return forceQuote ? '""' : '';
      let str = String(field).trim();
      str = str.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
      
      if (forceQuote || str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const baseUrl = 'https://www.zorando.com';
    
    const rows = exportedProducts.map((p: any) => {
      const id = formatField(String(p.id));
      const title = formatField(String(p.name).substring(0, 150), true);
      
      let rawDesc = p.description || p.name || '';
      let descriptionText = rawDesc.replace(/\s+/g, ' ').trim().substring(0, 5000);
      const description = formatField(descriptionText, true);
      
      const availability = p.is_active !== false ? 'in stock' : 'out of stock';
      const condition = 'new';
      
      const priceVal = p.promo_price > 0 ? p.promo_price : p.price;
      const price = `${Number(priceVal).toFixed(2)} DZD`;
      
      const link = `${baseUrl}/product/${p.slug}`;
      
      const vMatch = p.image.match(/(\?v=[^&]+)/);
      const vParam = vMatch ? vMatch[1] : '';
      const seoSlug = p.slug ? `/${p.slug}.webp` : '';
      const image_link = `${baseUrl}/api/images/products/${p.id}/image${seoSlug}${vParam}`;
      
      const brand = formatField(p.brand_name || 'Zorando');

      return [id, title, description, availability, condition, price, link, image_link, brand].join(',');
    });

    const csvContent = [columns.join(','), ...rows].join('\n');

    setCache(cacheKey, csvContent, 60);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="meta-catalog.csv"');
    res.status(200).send(Buffer.from(csvContent));
  } catch (err) {
    console.error('Failed to export meta catalog:', err);
    res.status(500).json({ error: 'Failed to export meta catalog' });
  }
});

function generateSlug(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.post('/admin/products', authenticate, async (req, res) => {
  const { category_id, subcategory_id, sub_subcategory_id, brand_id, brand_name, name, description, price, promo_price, stock, image, main_image_alt, video_url, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, weight, is_active, images, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords } = req.body;
  
  try {
    const generatedSlug = generateSlug(name);
    
    const productId = await sql.begin(async (sql: any) => {
      const [info] = await sql`
        INSERT INTO products (category_id, subcategory_id, sub_subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, main_image_alt, video_url, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, weight, is_active, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords)
        VALUES (${category_id || null}, ${subcategory_id || null}, ${sub_subcategory_id || null}, ${brand_id || null}, ${brand_name || null}, ${name || ''}, ${generatedSlug || ''}, ${description || null}, ${price || 0}, ${promo_price || null}, ${stock || 0}, ${image || null}, ${main_image_alt || null}, ${video_url || null}, ${is_popular ? true : false}, ${is_best_seller ? true : false}, ${is_new ? true : false}, ${is_recommended ? true : false}, ${is_fast_delivery ? true : false}, ${weight || null}, ${is_active !== undefined ? is_active : true}, ${features ? sql.json(features) : null}, ${key_points ? sql.json(key_points) : null}, ${faq_q1 || null}, ${faq_a1 || null}, ${faq_q2 || null}, ${faq_a2 || null}, ${variations ? sql.json(variations) : null}, ${seo_title || null}, ${seo_description || null}, ${seo_keywords || null})
        RETURNING id
      `;
      
      const generatedSku = `PROD-${String(info.id).padStart(5, '0')}`;
      await sql`UPDATE products SET sku = ${generatedSku} WHERE id = ${info.id}`;

      if (image) {
         await sql`INSERT INTO product_images (product_id, image, is_main, alt_text) VALUES (${info.id}, ${image}, true, ${main_image_alt || null})`;
      }

      if (images && Array.isArray(images)) {
        for (const img of images) {
          await sql`INSERT INTO product_images (product_id, image, is_main, alt_text) VALUES (${info.id}, ${img.url || img.image}, ${img.is_main ? true : false}, ${img.alt_text || null})`;
        }
      }
      return info.id;
    });
    res.status(201).json({ id: productId, message: 'Product created' });
  } catch (err) {
    console.error('Failed to create product:', err);
    res.status(500).json({ error: 'Failed to create product', details: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/admin/products/:id', authenticate, async (req, res) => {
  const { category_id, subcategory_id, sub_subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, main_image_alt, video_url, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, weight, is_active, images, features, key_points, faq_q1, faq_a1, faq_q2, faq_a2, variations, seo_title, seo_description, seo_keywords } = req.body;
  
  try {
    await sql.begin(async (sql: any) => {
      if (image && image.startsWith('/api/images/')) {
        await sql`
          UPDATE products 
          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, video_url = ${video_url || null}, is_popular = ${is_popular ? true : false}, is_best_seller = ${is_best_seller ? true : false}, is_new = ${is_new ? true : false}, is_recommended = ${is_recommended ? true : false}, is_fast_delivery = ${is_fast_delivery ? true : false}, weight = ${weight || null}, is_active = ${is_active !== undefined ? is_active : true}, features = ${features ? sql.json(features) : null}, key_points = ${key_points ? sql.json(key_points) : null}, faq_q1 = ${faq_q1 || null}, faq_a1 = ${faq_a1 || null}, faq_q2 = ${faq_q2 || null}, faq_a2 = ${faq_a2 || null}, variations = ${variations ? sql.json(variations) : null}, seo_title = ${seo_title || null}, seo_description = ${seo_description || null}, seo_keywords = ${seo_keywords || null}, main_image_alt = ${main_image_alt || null}
          WHERE id = ${req.params.id}
        `;
      } else {
        await sql`
          UPDATE products 
          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, sub_subcategory_id = ${sub_subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, image = ${image || null}, video_url = ${video_url || null}, is_popular = ${is_popular ? true : false}, is_best_seller = ${is_best_seller ? true : false}, is_new = ${is_new ? true : false}, is_recommended = ${is_recommended ? true : false}, is_fast_delivery = ${is_fast_delivery ? true : false}, weight = ${weight || null}, is_active = ${is_active !== undefined ? is_active : true}, features = ${features ? sql.json(features) : null}, key_points = ${key_points ? sql.json(key_points) : null}, faq_q1 = ${faq_q1 || null}, faq_a1 = ${faq_a1 || null}, faq_q2 = ${faq_q2 || null}, faq_a2 = ${faq_a2 || null}, variations = ${variations ? sql.json(variations) : null}, seo_title = ${seo_title || null}, seo_description = ${seo_description || null}, seo_keywords = ${seo_keywords || null}, main_image_alt = ${main_image_alt || null}
          WHERE id = ${req.params.id}
        `;
      }

      const [existingMainImg] = await sql`SELECT id FROM product_images WHERE product_id = ${req.params.id} AND is_main = true`;
      if (existingMainImg) {
        await sql`UPDATE product_images SET alt_text = ${main_image_alt || null} WHERE id = ${existingMainImg.id}`;
      } else if (image && !image.startsWith('/api/images/')) {
        await sql`INSERT INTO product_images (product_id, image, is_main, alt_text) VALUES (${req.params.id}, ${image}, true, ${main_image_alt || null})`;
      }

      if (images && Array.isArray(images)) {
        const imagesToKeep: string[] = [];
        const imagesToInsert: any[] = [];
        
        for (const img of images) {
          let imgData = img.url || img.image;
          if (imgData && imgData.startsWith('/api/images/product_images/')) {
            const imgId = imgData.split('/')[4];
            if (imgId) {
              imagesToKeep.push(imgId);
              await sql`UPDATE product_images SET is_main = ${img.is_main ? true : false}, alt_text = ${img.alt_text || null} WHERE id = ${imgId}`;
            }
          } else if (imgData) {
            imagesToInsert.push(img);
          }
        }
        
        if (imagesToKeep.length > 0) {
          await sql`DELETE FROM product_images WHERE product_id = ${req.params.id} AND id NOT IN ${sql(imagesToKeep)}`;
        } else {
          await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
        }
        
        for (const img of imagesToInsert) {
          let imgData = img.url || img.image;
          await sql`INSERT INTO product_images (product_id, image, is_main, alt_text) VALUES (${req.params.id}, ${imgData}, ${img.is_main ? true : false}, ${img.alt_text || null})`;
        }
      }
    });
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error('Failed to update product:', err);
    res.status(500).json({ error: 'Failed to update product', details: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/products/:id', authenticate, async (req, res) => {
  try {
    await sql.begin(async (sql: any) => {
      await sql`UPDATE order_items SET product_id = NULL WHERE product_id = ${req.params.id}`;
      await sql`DELETE FROM reviews WHERE product_id = ${req.params.id}`;
      await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
      await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/admin/categories', authenticate, async (req, res) => {
  const { name, slug, image, slide_image, mobile_slide_image } = req.body;
  try {
    const [info] = await sql`INSERT INTO categories (name, slug, image, slide_image, mobile_slide_image) VALUES (${name || ''}, ${slug || ''}, ${image || null}, ${slide_image || null}, ${mobile_slide_image || null}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Category created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/admin/categories/:id', authenticate, async (req, res) => {
  const { name, slug, image, slide_image, mobile_slide_image } = req.body;
  try {
    const isImageNew = image && !image.startsWith('/api/images/');
    const isSlideImageNew = slide_image && !slide_image.startsWith('/api/images/');
    const isMobileSlideImageNew = mobile_slide_image && !mobile_slide_image.startsWith('/api/images/');
    
    // Build dynamic update query
    let setClause = sql`name = ${name || ''}, slug = ${slug || ''}`;
    
    if (image === null || image === '') {
      setClause = sql`${setClause}, image = NULL`;
    } else if (isImageNew) {
      setClause = sql`${setClause}, image = ${image}`;
    }

    if (slide_image === null || slide_image === '') {
      setClause = sql`${setClause}, slide_image = NULL`;
    } else if (isSlideImageNew) {
      setClause = sql`${setClause}, slide_image = ${slide_image}`;
    }

    if (mobile_slide_image === null || mobile_slide_image === '') {
      setClause = sql`${setClause}, mobile_slide_image = NULL`;
    } else if (isMobileSlideImageNew) {
      setClause = sql`${setClause}, mobile_slide_image = ${mobile_slide_image}`;
    }

    await sql`UPDATE categories SET ${setClause} WHERE id = ${req.params.id}`;
    
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.post('/admin/brands', authenticate, async (req, res) => {
  const { name, slug, image, description, seo_title, seo_description, h1_title, seo_content } = req.body;
  try {
    const [info] = await sql`INSERT INTO brands (name, slug, image, description, seo_title, seo_description, h1_title, seo_content) VALUES (${name || ''}, ${slug || ''}, ${image || null}, ${description || null}, ${seo_title || null}, ${seo_description || null}, ${h1_title || null}, ${seo_content || null}) RETURNING id`;
    res.json({ id: info.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/admin/brands/:id', authenticate, async (req, res) => {
  const { name, slug, image, description, seo_title, seo_description, h1_title, seo_content } = req.body;
  try {
    if (image && image.startsWith('/api/images/')) {
      await sql`UPDATE brands SET name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, seo_title = ${seo_title || null}, seo_description = ${seo_description || null}, h1_title = ${h1_title || null}, seo_content = ${seo_content || null} WHERE id = ${req.params.id}`;
    } else {
      await sql`UPDATE brands SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null}, description = ${description || null}, seo_title = ${seo_title || null}, seo_description = ${seo_description || null}, h1_title = ${h1_title || null}, seo_content = ${seo_content || null} WHERE id = ${req.params.id}`;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

router.delete('/admin/brands/:id', authenticate, async (req, res) => {
  try {
    const [productsCount] = await sql`SELECT COUNT(*) as count FROM products WHERE brand_id = ${req.params.id}`;
    if (productsCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete brand with associated products' });
    }
    await sql`DELETE FROM brands WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

router.delete('/admin/categories/:id', authenticate, async (req, res) => {
  try {
    await sql.begin(async (sql: any) => {
      await sql`UPDATE products SET category_id = NULL, subcategory_id = NULL WHERE category_id = ${req.params.id}`;
      await sql`DELETE FROM subcategories WHERE category_id = ${req.params.id}`;
      await sql`DELETE FROM categories WHERE id = ${req.params.id}`;
    });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.post('/admin/subcategories', authenticate, async (req, res) => {
  const { category_id, name, slug, image } = req.body;
  try {
    const [info] = await sql`INSERT INTO subcategories (category_id, name, slug, image) VALUES (${category_id || null}, ${name || ''}, ${slug || ''}, ${image || null}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Subcategory created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

router.put('/admin/subcategories/:id', authenticate, async (req, res) => {
  const { category_id, name, slug, image } = req.body;
  try {
    if (image && image.startsWith('/api/images/')) {
      await sql`UPDATE subcategories SET category_id = ${category_id || null}, name = ${name || ''}, slug = ${slug || ''} WHERE id = ${req.params.id}`;
    } else {
      await sql`UPDATE subcategories SET category_id = ${category_id || null}, name = ${name || ''}, slug = ${slug || ''}, image = ${image || null} WHERE id = ${req.params.id}`;
    }
    res.json({ message: 'Subcategory updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

router.delete('/admin/subcategories/:id', authenticate, async (req, res) => {
  try {
    await sql.begin(async (sql: any) => {
      await sql`UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ${req.params.id}`;
      await sql`DELETE FROM subcategories WHERE id = ${req.params.id}`;
    });
    res.json({ message: 'Subcategory deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

// Admin Sub-subcategories
router.post('/admin/sub_subcategories', authenticate, async (req, res) => {
  const { subcategory_id, name, slug, image } = req.body;
  try {
    const [info] = await sql`INSERT INTO sub_subcategories (subcategory_id, name, slug, image) VALUES (${subcategory_id || null}, ${name || ''}, ${slug || ''}, ${image || null}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Sub-subcategory created' });
  } catch (err: any) {
    console.error('Error creating sub-subcategory:', err);
    res.status(500).json({ error: err.message || 'Failed to create sub-subcategory' });
  }
});

router.put('/admin/sub_subcategories/:id', authenticate, async (req, res) => {
  const { subcategory_id, name, slug, image } = req.body;
  try {
    if (image && image.startsWith('/api/images/')) {
      await sql`UPDATE sub_subcategories SET subcategory_id = ${subcategory_id || null}, name = ${name || ''}, slug = ${slug || ''} WHERE id = ${req.params.id}`;
    } else {
      await sql`UPDATE sub_subcategories SET subcategory_id = ${subcategory_id || null}, name = ${name || ''}, slug = ${slug || ''}, image = ${image || null} WHERE id = ${req.params.id}`;
    }
    res.json({ message: 'Sub-subcategory updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sub-subcategory' });
  }
});

router.delete('/admin/sub_subcategories/:id', authenticate, async (req, res) => {
  try {
    await sql.begin(async (sql: any) => {
      await sql`UPDATE products SET sub_subcategory_id = NULL WHERE sub_subcategory_id = ${req.params.id}`;
      await sql`DELETE FROM sub_subcategories WHERE id = ${req.params.id}`;
    });
    res.json({ message: 'Sub-subcategory deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sub-subcategory' });
  }
});

router.get('/wilayas', async (req, res) => {
  const cacheKey = 'wilayas_all';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const wilayas = await sql`SELECT * FROM wilayas ORDER BY number ASC`;
    setCache(cacheKey, wilayas, 60);
    res.json(wilayas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wilayas' });
  }
});

router.get('/admin/wilayas', authenticate, async (req, res) => {
  try {
    const wilayas = await sql`SELECT * FROM wilayas ORDER BY number ASC`;
    res.json(wilayas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin wilayas' });
  }
});

router.post('/admin/wilayas', authenticate, async (req, res) => {
  const { number, name, delivery_cost, stop_desk_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    const [info] = await sql`INSERT INTO wilayas (number, name, delivery_cost, stop_desk_cost, is_active) VALUES (${number}, ${name}, ${delivery_cost}, ${stop_desk_cost || 0}, ${is_active !== undefined ? (is_active ? true : false) : true}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Wilaya ajoutée' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce numéro de wilaya existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la wilaya' });
  }
});

router.put('/admin/wilayas/:id', authenticate, async (req, res) => {
  const { number, name, delivery_cost, stop_desk_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    await sql`UPDATE wilayas SET number = ${number}, name = ${name}, delivery_cost = ${delivery_cost}, stop_desk_cost = ${stop_desk_cost || 0}, is_active = ${is_active ? true : false} WHERE id = ${req.params.id}`;
    res.json({ message: 'Wilaya modifiée' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce numéro de wilaya existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la modification de la wilaya' });
  }
});

router.delete('/admin/wilayas/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM wilayas WHERE id = ${req.params.id}`;
    res.json({ message: 'Wilaya supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la wilaya' });
  }
});

router.get('/offices', async (req, res) => {
  const cacheKey = 'offices_all';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const offices = await sql`SELECT * FROM offices ORDER BY wilaya ASC, name ASC`;
    setCache(cacheKey, offices, 60);
    res.json(offices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch offices' });
  }
});

router.get('/admin/offices', authenticate, async (req, res) => {
  try {
    const offices = await sql`SELECT * FROM offices ORDER BY wilaya ASC, name ASC`;
    res.json(offices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin offices' });
  }
});

router.post('/admin/offices', authenticate, async (req, res) => {
  const { name, address, wilaya, commune, phone } = req.body;
  if (!name || !address || !wilaya || !commune) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }
  try {
    const [info] = await sql`
      INSERT INTO offices (name, address, wilaya, commune, phone) 
      VALUES (${name}, ${address}, ${wilaya}, ${commune}, ${phone || null}) 
      RETURNING id
    `;
    res.status(201).json({ id: info.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add office' });
  }
});

router.put('/admin/offices/:id', authenticate, async (req, res) => {
  const { name, address, wilaya, commune, phone } = req.body;
  if (!name || !address || !wilaya || !commune) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  }
  try {
    const [info] = await sql`
      UPDATE offices 
      SET name = ${name}, address = ${address}, wilaya = ${wilaya}, commune = ${commune}, phone = ${phone || null}
      WHERE id = ${req.params.id}
      RETURNING id
    `;
    if (!info) return res.status(404).json({ error: 'Point relais non trouvé' });
    res.json({ id: info.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update office' });
  }
});

router.delete('/admin/offices/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM offices WHERE id = ${req.params.id}`;
    res.json({ message: 'Office deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete office' });
  }
});

// --- Communes ---
router.get('/communes/public', async (req, res) => {
  const cacheKey = 'communes_public';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const communesList = await sql`SELECT wilaya, name FROM communes ORDER BY wilaya ASC, name ASC`;
    const communesDict: Record<string, string[]> = {};
    for (const c of communesList) {
      if (!communesDict[c.wilaya]) communesDict[c.wilaya] = [];
      communesDict[c.wilaya].push(c.name);
    }
    setCache(cacheKey, communesDict, 60);
    res.json(communesDict);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch communes' });
  }
});

router.get('/admin/communes', authenticate, async (req, res) => {
  try {
    const communesList = await sql`SELECT id, wilaya, name FROM communes ORDER BY wilaya ASC, name ASC`;
    res.json(communesList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin communes' });
  }
});

router.post('/admin/communes', authenticate, async (req, res) => {
  try {
    const { wilaya, name } = req.body;
    if (!wilaya || !name) {
      return res.status(400).json({ error: 'Wilaya et nom de commune requis' });
    }
    const [info] = await sql`INSERT INTO communes (wilaya, name) VALUES (${wilaya}, ${name}) RETURNING id`;
    res.json({ id: info.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add commune' });
  }
});

router.put('/admin/communes/:id', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom de commune requis' });
    await sql`UPDATE communes SET name = ${name} WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update commune' });
  }
});

router.delete('/admin/communes/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM communes WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete commune' });
  }
});

// ==========================================
// BLOG FRONT-END
// ==========================================

router.get('/blog/categories', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const categories = await sql`SELECT * FROM blog_categories ORDER BY name ASC`;
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog categories' });
  }
});

router.get('/blog/posts', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const { category, search, page = '1', limit = '9' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    let conditions = [sql`status = 'published'`];
    
    if (category) {
      conditions.push(sql`category_id = (SELECT id FROM blog_categories WHERE slug = ${category as string} LIMIT 1)`);
    }
    if (search) {
      conditions.push(sql`(title ILIKE ${'%' + search + '%'} OR excerpt ILIKE ${'%' + search + '%'})`);
    }

    const whereClause = conditions.length > 0 
      ? sql`WHERE ${conditions.reduce((acc, curr, idx) => idx === 0 ? curr : sql`${acc} AND ${curr}`, sql``)}`
      : sql``;

    const [totalCount] = await sql`SELECT COUNT(*) as count FROM blog_posts ${whereClause}`;
    const posts = await sql`
      SELECT ${sql.unsafe(BLOG_POSTS_LIST_COLS)}, c.name as category_name, c.slug as category_slug 
      FROM blog_posts p 
      LEFT JOIN blog_categories c ON p.category_id = c.id 
      ${whereClause} 
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    res.json({ posts, totalCount: parseInt(totalCount.count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/blog/posts/:slug', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  try {
    const [post] = await sql`
      SELECT p.id, p.category_id, p.title, p.slug, p.excerpt, p.content, CASE WHEN p.image_url LIKE 'data:image/%' THEN '/api/images/blog_posts/' || p.id || '/image_url?v=' || LENGTH(p.image_url) ELSE p.image_url END as image_url, p.status, p.published_at, p.created_at, p.seo_title, p.seo_description, c.name as category_name, c.slug as category_slug 
      FROM blog_posts p 
      LEFT JOIN blog_categories c ON p.category_id = c.id 
      WHERE p.slug = ${req.params.slug} AND p.status = 'published'
    `;
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // get related posts
    const related = await sql`
      SELECT ${sql.unsafe(BLOG_POSTS_LIST_COLS)} FROM blog_posts p
      WHERE p.category_id = ${post.category_id} AND p.id != ${post.id} AND p.status = 'published'
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT 3
    `;
    post.related = related;

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// ==========================================
// BLOG ADMIN (CRUD)
// ==========================================

router.get('/admin/blog/categories', authenticate, async (req, res) => {
  try {
    const categories = await sql`SELECT * FROM blog_categories ORDER BY name ASC`;
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/admin/blog/categories', authenticate, async (req, res) => {
  try {
    const { name, slug } = req.body;
    const [cat] = await sql`INSERT INTO blog_categories (name, slug) VALUES (${name}, ${slug}) RETURNING id`;
    res.json({ id: cat.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/admin/blog/categories/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM blog_categories WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Obsolete' });
  }
});

router.get('/admin/blog/posts', authenticate, async (req, res) => {
  try {
    const posts = await sql`
      SELECT ${sql.unsafe(BLOG_POSTS_LIST_COLS)}, c.name as category_name 
      FROM blog_posts p 
      LEFT JOIN blog_categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `;
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/admin/blog/posts', authenticate, async (req, res) => {
  try {
    const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description } = req.body;
    const published_at = status === 'published' ? new Date().toISOString() : null;
    const [p] = await sql`
      INSERT INTO blog_posts (category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description, published_at)
      VALUES (${category_id || null}, ${title}, ${slug}, ${excerpt}, ${content}, ${image_url}, ${status}, ${seo_title}, ${seo_description}, ${published_at})
      RETURNING id
    `;
    res.json({ id: p.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/admin/blog/posts/:id', authenticate, async (req, res) => {
  try {
    const { category_id, title, slug, excerpt, content, image_url, status, seo_title, seo_description } = req.body;
    const p = await sql`SELECT id, published_at FROM blog_posts WHERE id = ${req.params.id}`;
    if (!p.length) return res.status(404).json({ error: 'Not found' });
    
    let published_at = p[0].published_at;
    if (status === 'published' && !published_at) {
        published_at = new Date().toISOString();
    }

    await sql`
      UPDATE blog_posts SET 
        category_id = ${category_id || null}, title = ${title}, slug = ${slug}, excerpt = ${excerpt}, 
        content = ${content}, image_url = ${image_url}, status = ${status}, 
        seo_title = ${seo_title}, seo_description = ${seo_description}, 
        updated_at = CURRENT_TIMESTAMP,
        published_at = ${published_at}
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/admin/blog/posts/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM blog_posts WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
