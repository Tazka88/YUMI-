import { Router } from 'express';
import { sql } from '../db/setup.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import fs from 'fs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yumi-secret-key-123';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'yumi-secret-key-123') {
  console.warn('WARNING: JWT_SECRET environment variable is missing in production! Using default insecure key.');
}

// Rate Limiter for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard.' },
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown'
});

// Rate Limiter for Orders
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de commandes passées récemment. Veuillez patienter.' },
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown'
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

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
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
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
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

router.get('/slides', async (req, res) => {
  try {
    const slides = await sql`SELECT * FROM slides ORDER BY order_index ASC`;
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = await sql`SELECT * FROM brands ORDER BY name ASC`;
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.get('/brands/:slug', async (req, res) => {
  try {
    const [brand] = await sql`SELECT * FROM brands WHERE slug = ${req.params.slug}`;
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
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
    
    res.json(categoriesWithSubcats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = await sql`SELECT * FROM subcategories`;
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
  
  try {
    const products = await sql`
      SELECT p.*, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image 
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
      LIMIT 100
    `;
    
    products.forEach(p => {
      p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
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
      SELECT p.*, c.name as category_name, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN brands b ON p.brand_id = b.id 
      WHERE p.slug = ${req.params.slug}
    `;
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    product.features = typeof product.features === 'string' ? JSON.parse(product.features) : (product.features || []);
    product.key_points = typeof product.key_points === 'string' ? JSON.parse(product.key_points) : (product.key_points || []);

    const images = await sql`SELECT * FROM product_images WHERE product_id = ${product.id}`;
    product.images = images;
    
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

    const orderId = await sql.begin(async (sql: any) => {
      const [order] = await sql`
        INSERT INTO orders (customer_name, customer_phone, wilaya, address, note, total_amount, delivery_cost)
        VALUES (${customer_name || ''}, ${customer_phone || ''}, ${wilaya || ''}, ${address || ''}, ${note || null}, ${calculatedTotal}, ${delivery_cost})
        RETURNING id
      `;
      
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
      return order.id;
    });
    
    const [adminEmailSetting] = await sql`SELECT value FROM settings WHERE key = 'admin_email'`;
    if (adminEmailSetting && adminEmailSetting.value) {
      console.log(`[EMAIL SIMULATION] Nouvelle commande #${orderId} envoyée à l'administrateur : ${adminEmailSetting.value}`);
    }
    
    res.status(201).json({ id: orderId, message: 'Order created successfully' });
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
      acc[setting.key] = setting.value;
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL;
    const uploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (req.file.mimetype === 'image/svg+xml') {
      const filename = `${uniqueSuffix}.svg`;
      const outputPath = path.join(uploadsDir, filename);
      fs.writeFileSync(outputPath, req.file.buffer);
      return res.json({ url: `/uploads/${filename}` });
    }

    const filename = `${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.get('/admin/slides', authenticate, async (req, res) => {
  try {
    const slides = await sql`SELECT * FROM slides ORDER BY order_index ASC`;
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

router.post('/admin/slides', authenticate, async (req, res) => {
  const { title, description, image, link, button_text, order_index } = req.body;
  try {
    const [info] = await sql`INSERT INTO slides (title, description, image, link, button_text, order_index) VALUES (${title || ''}, ${description || null}, ${image || ''}, ${link || null}, ${button_text || null}, ${order_index || 0}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Slide created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

router.put('/admin/slides/:id', authenticate, async (req, res) => {
  const { title, description, image, link, button_text, order_index } = req.body;
  try {
    await sql`UPDATE slides SET title = ${title || ''}, description = ${description || null}, image = ${image || ''}, link = ${link || null}, button_text = ${button_text || null}, order_index = ${order_index || 0} WHERE id = ${req.params.id}`;
    res.json({ message: 'Slide updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

router.delete('/admin/slides/:id', authenticate, async (req, res) => {
  try {
    await sql`DELETE FROM slides WHERE id = ${req.params.id}`;
    res.json({ message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slide' });
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
      p.features = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      p.key_points = typeof p.key_points === 'string' ? JSON.parse(p.key_points) : (p.key_points || []);
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
      await sql`
        UPDATE products 
        SET category_id = ${category_id || null}, subcategory_id = ${subcategory_id || null}, brand_id = ${brand_id || null}, brand_name = ${brand_name || null}, name = ${name || ''}, slug = ${slug || ''}, description = ${description || null}, price = ${price || 0}, promo_price = ${promo_price || null}, stock = ${stock || 0}, image = ${image || null}, is_popular = ${is_popular ? true : false}, is_best_seller = ${is_best_seller ? true : false}, is_new = ${is_new ? true : false}, is_recommended = ${is_recommended ? true : false}, is_fast_delivery = ${is_fast_delivery ? true : false}, features = ${features ? JSON.stringify(features) : null}::jsonb, key_points = ${key_points ? JSON.stringify(key_points) : null}::jsonb
        WHERE id = ${req.params.id}
      `;

      if (images && Array.isArray(images)) {
        await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
        for (const img of images) {
          await sql`INSERT INTO product_images (product_id, image, is_main) VALUES (${req.params.id}, ${img.url || img.image}, ${img.is_main ? true : false})`;
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
  const { name, slug, image } = req.body;
  try {
    const [info] = await sql`INSERT INTO categories (name, slug, image) VALUES (${name || ''}, ${slug || ''}, ${image || null}) RETURNING id`;
    res.status(201).json({ id: info.id, message: 'Category created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/admin/categories/:id', authenticate, async (req, res) => {
  const { name, slug, image } = req.body;
  try {
    await sql`UPDATE categories SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null} WHERE id = ${req.params.id}`;
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
    await sql`UPDATE brands SET name = ${name || ''}, slug = ${slug || ''}, image = ${image || null}, description = ${description || null} WHERE id = ${req.params.id}`;
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
    await sql`UPDATE subcategories SET category_id = ${category_id || null}, name = ${name || ''}, slug = ${slug || ''}, image = ${image || null} WHERE id = ${req.params.id}`;
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
