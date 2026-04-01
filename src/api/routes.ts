import { Router } from 'express';
import { sql } from '../db/setup.js';
import { getSupabase } from '../lib/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

const router = Router();

// Helper to process images to avoid Vercel 4.5MB payload limit
const processImage = (table: string, id: number | string, field: string, image: string | null) => {
  if (!image) return null;
  if (image.startsWith('data:image/')) {
    // Create a simple hash from the base64 string to bust cache when image changes
    const hash = image.substring(image.length - 20).replace(/[^a-zA-Z0-9]/g, '');
    return `/api/images/${table}/${id}/${field}?v=${hash}`;
  }
  return image;
};

// Route to serve images from the database
router.get('/images/:table/:id/:field', async (req, res) => {
  const { table, id, field } = req.params;
  
  // Validate table and field to prevent SQL injection
  const allowedTables = ['products', 'categories', 'subcategories', 'brands', 'product_images', 'settings', 'slider_images'];
  const allowedFields = ['image', 'value', 'image_url', 'slide_image'];
  
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
    
    if (imageData.startsWith('data:image/')) {
      const matches = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', `image/${ext}`);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        return res.send(buffer);
      }
    }
    
    // If it's a regular URL, redirect
    if (imageData.startsWith('http')) {
      return res.redirect(imageData);
    }
    
    res.status(404).json({ error: 'Invalid image format' });
  } catch (err) {
    console.error('Error serving image:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'yumi-secret-key-123';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'yumi-secret-key-123') {
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg|avif/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Seules les images sont autorisées !'));
  }
});

const authenticate = async (req: any, res: any, next: any) => {
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
  const baseUrl = process.env.APP_URL || `https://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`);
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || `https://${req.get('host')}`;
    
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

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).end();
  }
});

router.get('/pages', async (req, res) => {
  try {
    const pages = await sql`SELECT id, title, slug, created_at, updated_at FROM pages`;
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.get('/pages/:slug', async (req, res) => {
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
    const settings = await sql`SELECT * FROM settings WHERE key != 'admin_email'`;
    const settingsObj = settings.reduce((acc: any, setting: any) => {
      let val = setting.value;
      if (setting.key === 'site_logo' || setting.key.startsWith('theme_image_')) {
        val = processImage('settings', setting.key, 'value', val);
      }
      acc[setting.key] = val;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message, stack: err.stack });
  }
});

router.get('/footer-links', async (req, res) => {
  try {
    const links = await sql`SELECT * FROM footer_links ORDER BY column_id ASC, order_index ASC`;
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch footer links' });
  }
});

router.get('/slider-images', async (req, res) => {
  try {
    const sliderImages = await sql`SELECT * FROM slider_images ORDER BY position ASC`;
    
    sliderImages.forEach((s: any) => {
      s.image_url = processImage('slider_images', s.id, 'image_url', s.image_url);
    });
    res.json(sliderImages);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slider images' });
  }
});

router.post('/slider-images', authenticate, async (req, res) => {
  const { image_url, category_id, position, is_active, title, description, button_text, button_link } = req.body;
  try {
    const [newSliderImage] = await sql`
      INSERT INTO slider_images (image_url, category_id, position, is_active, title, description, button_text, button_link)
      VALUES (${image_url}, ${category_id || null}, ${position || 0}, ${is_active !== undefined ? is_active : true}, ${title || null}, ${description || null}, ${button_text || null}, ${button_link || null})
      RETURNING *
    `;
    res.status(201).json(newSliderImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create slider image' });
  }
});

router.put('/slider-images/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { image_url, category_id, position, is_active, title, description, button_text, button_link } = req.body;
  
  const isImageNew = image_url && !image_url.startsWith('/api/images/');
  
  try {
    let updatedSliderImage;
    
    if (isImageNew) {
      const [result] = await sql`
        UPDATE slider_images
        SET image_url = ${image_url},
            category_id = ${category_id !== undefined ? category_id : sql`category_id`},
            position = COALESCE(${position}, position),
            is_active = COALESCE(${is_active}, is_active),
            title = ${title !== undefined ? title : sql`title`},
            description = ${description !== undefined ? description : sql`description`},
            button_text = ${button_text !== undefined ? button_text : sql`button_text`},
            button_link = ${button_link !== undefined ? button_link : sql`button_link`}
        WHERE id = ${id}
        RETURNING *
      `;
      updatedSliderImage = result;
    } else {
      const [result] = await sql`
        UPDATE slider_images
        SET category_id = ${category_id !== undefined ? category_id : sql`category_id`},
            position = COALESCE(${position}, position),
            is_active = COALESCE(${is_active}, is_active),
            title = ${title !== undefined ? title : sql`title`},
            description = ${description !== undefined ? description : sql`description`},
            button_text = ${button_text !== undefined ? button_text : sql`button_text`},
            button_link = ${button_link !== undefined ? button_link : sql`button_link`}
        WHERE id = ${id}
        RETURNING *
      `;
      updatedSliderImage = result;
    }
    
    if (!updatedSliderImage) return res.status(404).json({ error: 'Slider image not found' });
    res.json(updatedSliderImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slider image' });
  }
});

router.delete('/slider-images/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM slider_images WHERE id = ${id}`;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slider image' });
  }
});

router.put('/slider-images/reorder', authenticate, async (req, res) => {
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
    const brands = await sql`SELECT * FROM brands ORDER BY name ASC`;
    
    brands.forEach((b: any) => {
      b.image = processImage('brands', b.id, 'image', b.image);
    });
    res.json(brands);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.get('/brands/:slug', async (req, res) => {
  try {
    const [brand] = await sql`SELECT * FROM brands WHERE slug = ${req.params.slug}`;
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    
    brand.image = processImage('brands', brand.id, 'image', brand.image);
    res.json(brand);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await sql`SELECT * FROM categories`;
    const subcategories = await sql`SELECT * FROM subcategories`;
    
    const categoriesWithSubcats = categories.map((cat: any) => ({
      ...cat,
      subcategories: subcategories.filter((sub: any) => sub.category_id === cat.id)
    }));
    
    
    categoriesWithSubcats.forEach((c: any) => {
      c.image = processImage('categories', c.id, 'image', c.image);
      c.slide_image = processImage('categories', c.id, 'slide_image', c.slide_image);
      if (c.subcategories && Array.isArray(c.subcategories)) {
        c.subcategories.forEach((sub: any) => {
          sub.image = processImage('subcategories', sub.id, 'image', sub.image);
        });
      }
    });
    res.json(categoriesWithSubcats);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = await sql`SELECT * FROM subcategories`;
    
    subcategories.forEach((s: any) => {
      s.image = processImage('subcategories', s.id, 'image', s.image);
    });
    res.json(subcategories);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

router.get('/products', async (req, res) => {
  const category = req.query.category as string | undefined;
  const subcategory = req.query.subcategory as string | undefined;
  const brand = req.query.brand as string | undefined;
  const search = req.query.search as string | undefined;
  const popular = req.query.popular as string | undefined;
  const best_seller = req.query.best_seller as string | undefined;
  const isNew = req.query.new as string | undefined;
  const recommended = req.query.recommended as string | undefined;
  const promotions = req.query.promotions as string | undefined;
  const ids = req.query.ids as string | undefined;
  
  try {
    const idArray = ids ? ids.split(',').map(id => Number(id)).filter(id => !isNaN(id)) : [];
    
    const products = await sql`
      SELECT p.*, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
      (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE 
        (${category || null}::text IS NULL OR p.category_id = (SELECT id FROM categories WHERE slug = ${category || null} OR id = ${Number(category) || 0} LIMIT 1))
        AND (${subcategory || null}::text IS NULL OR p.subcategory_id = (SELECT id FROM subcategories WHERE slug = ${subcategory || null} OR id = ${Number(subcategory) || 0} LIMIT 1))
        AND (${brand || null}::text IS NULL OR p.brand_id = (SELECT id FROM brands WHERE slug = ${brand || null} OR id = ${Number(brand) || 0} LIMIT 1))
        AND (${search || null}::text IS NULL OR p.name ILIKE ${search ? '%' + search + '%' : null})
        AND (${popular === 'true' ? true : null}::boolean IS NULL OR p.is_popular = true)
        AND (${best_seller === 'true' ? true : null}::boolean IS NULL OR p.is_best_seller = true)
        AND (${isNew === 'true' ? true : null}::boolean IS NULL OR p.is_new = true)
        AND (${recommended === 'true' ? true : null}::boolean IS NULL OR p.is_recommended = true)
        AND (${promotions === 'true' ? true : null}::boolean IS NULL OR p.promo_price IS NOT NULL)
        AND (${idArray.length > 0 ? sql`p.id = ANY(${idArray})` : sql`true`})
      LIMIT 100
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
    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:slug', async (req, res) => {
  try {
    const [product] = await sql`
      SELECT p.*, c.name as category_name, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
      (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.slug = ${req.params.slug}
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

    const images = await sql`SELECT * FROM product_images WHERE product_id = ${product.id}`;
    product.images = images;
    
    
    product.image = processImage('products', product.id, 'image', product.image);
    if (product.brand_image) product.brand_image = processImage('brands', product.brand_id, 'image', product.brand_image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        img.image = processImage('product_images', img.id, 'image', img.image);
      });
    }
    res.json(product);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.get('/products/:slug/reviews', async (req, res) => {
  try {
    const [product] = await sql`SELECT id FROM products WHERE slug = ${req.params.slug}`;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const reviews = await sql`SELECT * FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/products/:slug/reviews', async (req, res) => {
  const { customer_name, rating, comment } = req.body;
  
  if (typeof customer_name !== 'string' || customer_name.length > 100) return res.status(400).json({ error: 'Nom invalide' });
  if (typeof comment !== 'string' || comment.length > 1000) return res.status(400).json({ error: 'Commentaire trop long' });
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ error: 'Note invalide' });

  try {
    const [product] = await sql`SELECT id FROM products WHERE slug = ${req.params.slug}`;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await sql`INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (${product.id}, ${customer_name}, ${rating}, ${comment})`;
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

router.post('/orders', orderLimiter, async (req, res) => {
  const { customer_name, customer_phone, wilaya, address, note, items, delivery_cost: clientDeliveryCost } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
  }

  try {
    let calculatedTotal = 0;
    const delivery_cost = typeof clientDeliveryCost === 'number' && clientDeliveryCost >= 0 ? clientDeliveryCost : 600;

    const validatedItems = [];
    for (const item of items) {
      const [product] = await sql`SELECT price, promo_price FROM products WHERE id = ${item.product_id}`;
      if (!product) throw new Error(`Produit invalide: ${item.product_id}`);
      
      const actualPrice = product.promo_price || product.price;
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) throw new Error('Quantité invalide');

      calculatedTotal += actualPrice * quantity;
      validatedItems.push({ ...item, price: actualPrice, quantity });
    }

    calculatedTotal += delivery_cost;

    const orderData = await sql.begin(async (sql: any) => {
      const [order] = await sql`
        INSERT INTO orders (customer_name, customer_phone, wilaya, address, note, total_amount, delivery_cost)
        VALUES (${customer_name || ''}, ${customer_phone || ''}, ${wilaya || ''}, ${address || ''}, ${note || null}, ${calculatedTotal}, ${delivery_cost})
        RETURNING id
      `;
      
      const generatedOrderId = `CMD-${1000 + order.id}`;
      await sql`UPDATE orders SET order_id = ${generatedOrderId} WHERE id = ${order.id}`;
      
      for (const item of validatedItems) {
        const result = await sql`
          UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.product_id} AND stock >= ${item.quantity}
        `;
        if (result.count === 0) {
          throw new Error(`Stock insuffisant pour le produit ID: ${item.product_id}`);
        }
        await sql`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price})
        `;
      }
      return { id: order.id, order_id: generatedOrderId };
    });
    
    const [adminEmailSetting] = await sql`SELECT value FROM settings WHERE key = 'admin_email'`;
    if (adminEmailSetting && adminEmailSetting.value) {
      console.log(`[EMAIL SIMULATION] Nouvelle commande ${orderData.order_id} envoyée à l'administrateur : ${adminEmailSetting.value}`);
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
      console.log(`[EMAIL SIMULATION] Nouveau message de contact de ${name} (${email}) envoyé à l'administrateur : ${adminEmailSetting.value}`);
      console.log(`Message: ${message}`);
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
    const settings = await sql`SELECT * FROM settings`;
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

router.post('/admin/upload', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    let buffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let ext = req.file.originalname.split('.').pop() || 'bin';

    if (req.file.mimetype !== 'image/svg+xml') {
      const sharp = (await import('sharp')).default;
      buffer = await sharp(req.file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      contentType = 'image/webp';
      ext = 'webp';
    }

    // If Supabase is configured, upload to Storage
    const supabase = getSupabase();
    if (supabase) {
      // Ensure bucket exists
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('images');
      if (bucketError && (bucketError.message.includes('not found') || bucketError.message.includes('does not exist') || (bucketError as any).status === 404 || bucketError.name === 'StorageApiError')) {
        console.log('Bucket "images" not found, creating it...');
        await supabase.storage.createBucket('images', { public: true });
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('images') // The user must create this bucket in Supabase
        .upload(fileName, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image to Supabase' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return res.json({ url: publicUrlData.publicUrl });
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

router.get('/admin/orders', authenticate, async (req, res) => {
  try {
    const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`;
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/admin/orders/:id', authenticate, async (req, res) => {
  try {
    const [order] = await sql`SELECT * FROM orders WHERE id = ${req.params.id}`;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const items = await sql`
      SELECT oi.*, p.name as product_name, p.image as product_image 
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
    await sql`UPDATE orders SET status = ${status} WHERE id = ${req.params.id}`;
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
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
    const products = await sql`
      SELECT p.*, c.name as category_name, s.name as subcategory_name, COALESCE(p.brand_name, b.name) as brand_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `;
    
    const productIds = products.map((p: any) => p.id);
    if (productIds.length > 0) {
      const images = await sql`SELECT * FROM product_images WHERE product_id IN ${sql(productIds)}`;
      products.forEach((p: any) => {
        p.images = images.filter((img: any) => img.product_id === p.id);
      });
    }
    
    products.forEach((p: any) => {
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
    res.json(products);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/admin/products', authenticate, async (req, res) => {
  const { category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, images, features, key_points } = req.body;
  
  try {
    const productId = await sql.begin(async (sql: any) => {
      const [info] = await sql`
        INSERT INTO products (category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, features, key_points)
        VALUES (${category_id || null}, ${subcategory_id || null}, ${brand_id || null}, ${brand_name || null}, ${name || ''}, ${slug || ''}, ${description || null}, ${price || 0}, ${promo_price || null}, ${stock || 0}, ${image || null}, ${is_popular ? true : false}, ${is_best_seller ? true : false}, ${is_new ? true : false}, ${is_recommended ? true : false}, ${is_fast_delivery ? true : false}, ${features ? JSON.stringify(features) : null}::jsonb, ${key_points ? JSON.stringify(key_points) : null}::jsonb)
        RETURNING id
      `;
      
      if (images && Array.isArray(images)) {
        for (const img of images) {
          await sql`INSERT INTO product_images (product_id, image, is_main) VALUES (${info.id}, ${img.url || img.image}, ${img.is_main ? true : false})`;
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
  const { category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, images, features, key_points } = req.body;
  
  try {
    await sql.begin(async (sql: any) => {
      if (image && image.startsWith('/api/images/')) {
        await sql`
          UPDATE products 
          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, is_popular = ${is_popular ? true : false}, is_best_seller = ${is_best_seller ? true : false}, is_new = ${is_new ? true : false}, is_recommended = ${is_recommended ? true : false}, is_fast_delivery = ${is_fast_delivery ? true : false}, features = ${features ? JSON.stringify(features) : null}::jsonb, key_points = ${key_points ? JSON.stringify(key_points) : null}::jsonb
          WHERE id = ${req.params.id}
        `;
      } else {
        await sql`
          UPDATE products 
          SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, image = ${image || null}, is_popular = ${is_popular ? true : false}, is_best_seller = ${is_best_seller ? true : false}, is_new = ${is_new ? true : false}, is_recommended = ${is_recommended ? true : false}, is_fast_delivery = ${is_fast_delivery ? true : false}, features = ${features ? JSON.stringify(features) : null}::jsonb, key_points = ${key_points ? JSON.stringify(key_points) : null}::jsonb
          WHERE id = ${req.params.id}
        `;
      }

      if (images && Array.isArray(images)) {
        const existingImages = await sql`SELECT id, image FROM product_images WHERE product_id = ${req.params.id}`;
        await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
        for (const img of images) {
          let imgData = img.url || img.image;
          if (imgData && imgData.startsWith('/api/images/product_images/')) {
            const imgId = imgData.split('/')[4];
            const existing = existingImages.find((e: any) => e.id.toString() === imgId);
            if (existing) {
              imgData = existing.image;
            }
          }
          await sql`INSERT INTO product_images (product_id, image, is_main) VALUES (${req.params.id}, ${imgData}, ${img.is_main ? true : false})`;
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
  const { name, slug, image, slide_image } = req.body;
  try {
    const [info] = await sql`INSERT INTO categories (name, slug, image, slide_image) VALUES (${name || ''}, ${slug || ''}, ${image || null}, ${slide_image || null}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Category created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/admin/categories/:id', authenticate, async (req, res) => {
  const { name, slug, image, slide_image } = req.body;
  try {
    let updateQuery;
    
    // We update name and slug
    // We only update image if it's not a local API URL (meaning it's a new upload or null)
    // Same for slide_image
    
    const isImageNew = image && !image.startsWith('/api/images/');
    const isSlideImageNew = slide_image && !slide_image.startsWith('/api/images/');
    
    if (isImageNew && isSlideImageNew) {
      await sql`UPDATE categories SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null}, slide_image = ${slide_image || null} WHERE id = ${req.params.id}`;
    } else if (isImageNew) {
      await sql`UPDATE categories SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null} WHERE id = ${req.params.id}`;
    } else if (isSlideImageNew) {
      await sql`UPDATE categories SET name = ${name || ''}, slug = ${slug || ''}, slide_image = ${slide_image || null} WHERE id = ${req.params.id}`;
    } else {
      await sql`UPDATE categories SET name = ${name || ''}, slug = ${slug || ''} WHERE id = ${req.params.id}`;
    }
    
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.post('/admin/brands', authenticate, async (req, res) => {
  const { name, slug, image, description } = req.body;
  try {
    const [info] = await sql`INSERT INTO brands (name, slug, image, description) VALUES (${name || ''}, ${slug || ''}, ${image || null}, ${description || null}) RETURNING id`;
    res.json({ id: info.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/admin/brands/:id', authenticate, async (req, res) => {
  const { name, slug, image, description } = req.body;
  try {
    if (image && image.startsWith('/api/images/')) {
      await sql`UPDATE brands SET name = ${name || ''}, slug = ${slug || ''}, description = ${description || null} WHERE id = ${req.params.id}`;
    } else {
      await sql`UPDATE brands SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null}, description = ${description || null} WHERE id = ${req.params.id}`;
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

router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await sql`SELECT * FROM wilayas ORDER BY number ASC`;
    res.json(wilayas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wilayas' });
  }
});

router.post('/admin/wilayas', authenticate, async (req, res) => {
  const { number, name, delivery_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    const [info] = await sql`INSERT INTO wilayas (number, name, delivery_cost, is_active) VALUES (${number}, ${name}, ${delivery_cost}, ${is_active !== undefined ? (is_active ? true : false) : true}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Wilaya ajoutée' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ce numéro de wilaya existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la wilaya' });
  }
});

router.put('/admin/wilayas/:id', authenticate, async (req, res) => {
  const { number, name, delivery_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    await sql`UPDATE wilayas SET number = ${number}, name = ${name}, delivery_cost = ${delivery_cost}, is_active = ${is_active ? true : false} WHERE id = ${req.params.id}`;
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

export default router;
