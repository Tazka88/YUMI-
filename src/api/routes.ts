import { Router } from 'express';
import { db } from '../db/setup.js';
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard.' },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Rate Limiter for Orders
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 orders per hour
  message: { error: 'Trop de commandes passées récemment. Veuillez patienter.' },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Configure multer for file uploads securely
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg|avif/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées !'));
  }
});

// Auth middleware
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
router.post('/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// --- PUBLIC ROUTES ---
router.get('/pages', (req, res) => {
  const pages = db.prepare('SELECT id, title, slug, created_at, updated_at FROM pages').all();
  res.json(pages);
});

router.get('/pages/:slug', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

router.get('/settings', (req, res) => {
  const settings = db.prepare("SELECT * FROM settings WHERE key != 'admin_email'").all();
  const settingsObj = settings.reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

router.get('/footer-links', (req, res) => {
  const links = db.prepare('SELECT * FROM footer_links ORDER BY column_id ASC, order_index ASC').all();
  res.json(links);
});

router.get('/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY order_index ASC').all();
  res.json(slides);
});

router.get('/brands', (req, res) => {
  const brands = db.prepare('SELECT * FROM brands ORDER BY name ASC').all();
  res.json(brands);
});

router.get('/brands/:slug', (req, res) => {
  const brand = db.prepare('SELECT * FROM brands WHERE slug = ?').get(req.params.slug);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json(brand);
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  const subcategories = db.prepare('SELECT * FROM subcategories').all();
  
  const categoriesWithSubcats = categories.map((cat: any) => ({
    ...cat,
    subcategories: subcategories.filter((sub: any) => sub.category_id === cat.id)
  }));
  
  res.json(categoriesWithSubcats);
});

router.get('/subcategories', (req, res) => {
  const subcategories = db.prepare('SELECT * FROM subcategories').all();
  res.json(subcategories);
});

router.get('/products', (req, res) => {
  const { category, subcategory, brand, search, popular, best_seller, new: isNew, recommended, promotions } = req.query;
  let query = 'SELECT p.*, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image FROM products p LEFT JOIN brands b ON p.brand_id = b.id WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND p.category_id = (SELECT id FROM categories WHERE slug = ? OR id = ?)';
    params.push(category, category);
  }
  if (subcategory) {
    query += ' AND p.subcategory_id = (SELECT id FROM subcategories WHERE slug = ? OR id = ?)';
    params.push(subcategory, subcategory);
  }
  if (brand) {
    query += ' AND p.brand_id = (SELECT id FROM brands WHERE slug = ? OR id = ?)';
    params.push(brand, brand);
  }
  if (search) {
    query += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  if (popular === 'true') query += ' AND p.is_popular = 1';
  if (best_seller === 'true') query += ' AND p.is_best_seller = 1';
  if (isNew === 'true') query += ' AND p.is_new = 1';
  if (recommended === 'true') query += ' AND p.is_recommended = 1';
  if (promotions === 'true') query += ' AND p.promo_price IS NOT NULL';

  // Add a hard limit to prevent memory exhaustion
  query += ' LIMIT 100';

  const products = db.prepare(query).all(...params) as any[];
  
  products.forEach(p => {
    if (p.features) {
      try {
        p.features = JSON.parse(p.features);
      } catch (e) {
        p.features = [];
      }
    } else {
      p.features = [];
    }
    
    if (p.key_points) {
      try {
        p.key_points = JSON.parse(p.key_points);
      } catch (e) {
        p.key_points = [];
      }
    } else {
      p.key_points = [];
    }
  });

  res.json(products);
});

router.get('/products/:slug', (req, res) => {
  const product = db.prepare('SELECT p.*, c.name as category_name, COALESCE(p.brand_name, b.name) as brand_name, b.slug as brand_slug, b.image as brand_image FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE p.slug = ?').get(req.params.slug) as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  if (product.features) {
    try {
      product.features = JSON.parse(product.features);
    } catch (e) {
      product.features = [];
    }
  } else {
    product.features = [];
  }

  if (product.key_points) {
    try {
      product.key_points = JSON.parse(product.key_points);
    } catch (e) {
      product.key_points = [];
    }
  } else {
    product.key_points = [];
  }

  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ?').all(product.id);
  product.images = images;
  
  res.json(product);
});

router.get('/products/:slug/reviews', (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(req.params.slug) as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(product.id);
  res.json(reviews);
});

router.post('/products/:slug/reviews', (req, res) => {
  const { customer_name, rating, comment } = req.body;
  
  if (typeof customer_name !== 'string' || customer_name.length > 100) return res.status(400).json({ error: 'Nom invalide' });
  if (typeof comment !== 'string' || comment.length > 1000) return res.status(400).json({ error: 'Commentaire trop long' });
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return res.status(400).json({ error: 'Note invalide' });

  const product = db.prepare('SELECT id FROM products WHERE slug = ?').get(req.params.slug) as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });

  try {
    const insert = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
    insert.run(product.id, customer_name, rating, comment);
    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

router.post('/orders', orderLimiter, (req, res) => {
  const { customer_name, customer_phone, wilaya, address, note, items, delivery_cost: clientDeliveryCost } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
  }

  try {
    let calculatedTotal = 0;
    
    // Use client delivery cost, fallback to 600 if invalid
    const delivery_cost = typeof clientDeliveryCost === 'number' && clientDeliveryCost >= 0 ? clientDeliveryCost : 600;

    const getProduct = db.prepare('SELECT price, promo_price FROM products WHERE id = ?');
    
    const validatedItems = items.map((item: any) => {
      const product = getProduct.get(item.product_id) as any;
      if (!product) throw new Error(`Produit invalide: ${item.product_id}`);
      
      const actualPrice = product.promo_price || product.price;
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) throw new Error('Quantité invalide');

      calculatedTotal += actualPrice * quantity;
      return { ...item, price: actualPrice, quantity };
    });

    calculatedTotal += delivery_cost;

    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_name, customer_phone, wilaya, address, note, total_amount, delivery_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
    `);

    const transaction = db.transaction(() => {
      const info = insertOrder.run(customer_name, customer_phone, wilaya, address, note, calculatedTotal, delivery_cost);
      const orderId = info.lastInsertRowid;
      for (const item of validatedItems) {
        const stockResult = updateStock.run(item.quantity, item.product_id, item.quantity);
        if (stockResult.changes === 0) {
          throw new Error(`Stock insuffisant pour le produit ID: ${item.product_id}`);
        }
        insertItem.run(orderId, item.product_id, item.quantity, item.price);
      }
      return orderId;
    });

    const orderId = transaction();
    
    // Simulate sending email to admin
    const adminEmailSetting = db.prepare("SELECT value FROM settings WHERE key = 'admin_email'").get() as any;
    if (adminEmailSetting && adminEmailSetting.value) {
      console.log(`[EMAIL SIMULATION] Nouvelle commande #${orderId} envoyée à l'administrateur : ${adminEmailSetting.value}`);
    }
    
    res.status(201).json({ id: orderId, message: 'Order created successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create order' });
  }
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  if (typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: 'Nom invalide' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide' });
  if (typeof message !== 'string' || message.length > 2000) return res.status(400).json({ error: 'Message trop long' });
  
  try {
    // Simulate sending email to admin
    const adminEmailSetting = db.prepare("SELECT value FROM settings WHERE key = 'admin_email'").get() as any;
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
router.post('/admin/pages', authenticate, (req, res) => {
  const { title, slug, content } = req.body;
  try {
    const result = db.prepare('INSERT INTO pages (title, slug, content) VALUES (?, ?, ?)').run(title, slug, content);
    res.json({ id: result.lastInsertRowid, title, slug, content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.put('/admin/pages/:id', authenticate, (req, res) => {
  const { title, slug, content } = req.body;
  try {
    db.prepare('UPDATE pages SET title = ?, slug = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, slug, content, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/admin/pages/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

router.get('/admin/settings', authenticate, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = settings.reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

router.put('/admin/credentials', authenticate, (req: any, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Mot de passe actuel requis' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
  }

  try {
    if (newUsername && newPassword) {
      const hash = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(newUsername, hash, userId);
    } else if (newUsername) {
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);
    } else if (newPassword) {
      const hash = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    }
    res.json({ success: true, message: 'Identifiants mis à jour avec succès' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour des identifiants' });
  }
});

router.post('/admin/settings', authenticate, (req, res) => {
  const settings = req.body;
  
  if (settings.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.admin_email)) {
    return res.status(400).json({ error: 'Format d\'email invalide' });
  }
  
  try {
    const updateSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          updateSetting.run(key, value as string);
        }
      }
    });
    transaction();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Footer Links
router.post('/admin/footer-links', authenticate, (req, res) => {
  const { name, url, column_id, order_index } = req.body;
  try {
    const insert = db.prepare('INSERT INTO footer_links (name, url, column_id, order_index) VALUES (?, ?, ?, ?)');
    const info = insert.run(name, url, column_id, order_index || 0);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Link created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

router.put('/admin/footer-links/reorder', authenticate, (req, res) => {
  const { links } = req.body; // Expecting array of { id, order_index, column_id }
  try {
    const update = db.prepare('UPDATE footer_links SET order_index = ?, column_id = ? WHERE id = ?');
    const transaction = db.transaction(() => {
      links.forEach((link: any) => {
        update.run(link.order_index, link.column_id, link.id);
      });
    });
    transaction();
    res.json({ message: 'Links reordered' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder links' });
  }
});

router.put('/admin/footer-links/:id', authenticate, (req, res) => {
  const { name, url, column_id, order_index } = req.body;
  try {
    const update = db.prepare('UPDATE footer_links SET name = ?, url = ?, column_id = ?, order_index = ? WHERE id = ?');
    update.run(name, url, column_id, order_index, req.params.id);
    res.json({ message: 'Link updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update link' });
  }
});

router.delete('/admin/footer-links/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM footer_links WHERE id = ?').run(req.params.id);
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
    
    // Ensure directory exists
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

    const imageUrl = `/uploads/${filename}`;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.get('/admin/slides', authenticate, (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY order_index ASC').all();
  res.json(slides);
});

router.post('/admin/slides', authenticate, (req, res) => {
  const { title, description, image, link, button_text, order_index } = req.body;
  try {
    const insert = db.prepare('INSERT INTO slides (title, description, image, link, button_text, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    const info = insert.run(title, description, image, link, button_text, order_index || 0);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Slide created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

router.put('/admin/slides/:id', authenticate, (req, res) => {
  const { title, description, image, link, button_text, order_index } = req.body;
  try {
    const update = db.prepare('UPDATE slides SET title = ?, description = ?, image = ?, link = ?, button_text = ?, order_index = ? WHERE id = ?');
    update.run(title, description, image, link, button_text, order_index || 0, req.params.id);
    res.json({ message: 'Slide updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

router.delete('/admin/slides/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.id);
    res.json({ message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

router.get('/admin/stats', authenticate, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
  const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status = ?').get('livrée') as any;
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 5').get() as any;
  res.json({
    orders: totalOrders.count,
    revenue: totalRevenue.total || 0,
    lowStock: lowStock.count
  });
});

router.get('/admin/orders', authenticate, (req, res) => {
  // Limit to last 500 orders to prevent memory issues
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all();
  res.json(orders);
});

router.put('/admin/orders/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated' });
});

router.get('/admin/products', authenticate, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, s.name as subcategory_name, COALESCE(p.brand_name, b.name) as brand_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    LEFT JOIN brands b ON p.brand_id = b.id
    ORDER BY p.id DESC
  `).all() as any[];
  
  const productIds = products.map(p => p.id);
  if (productIds.length > 0) {
    const images = db.prepare(`SELECT * FROM product_images WHERE product_id IN (${productIds.join(',')})`).all() as any[];
    products.forEach(p => {
      p.images = images.filter(img => img.product_id === p.id);
    });
  }
  
  products.forEach(p => {
    if (p.features) {
      try {
        p.features = JSON.parse(p.features);
      } catch (e) {
        p.features = [];
      }
    } else {
      p.features = [];
    }
    
    if (p.key_points) {
      try {
        p.key_points = JSON.parse(p.key_points);
      } catch (e) {
        p.key_points = [];
      }
    } else {
      p.key_points = [];
    }
  });

  res.json(products);
});

router.post('/admin/products', authenticate, (req, res) => {
  const { category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, images, features, key_points } = req.body;
  
  const transaction = db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO products (category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, features, key_points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(category_id, subcategory_id || null, brand_id || null, brand_name || null, name, slug, description, price, promo_price, stock, image, is_popular ? 1 : 0, is_best_seller ? 1 : 0, is_new ? 1 : 0, is_recommended ? 1 : 0, is_fast_delivery ? 1 : 0, features ? JSON.stringify(features) : null, key_points ? JSON.stringify(key_points) : null);
    const productId = info.lastInsertRowid;

    if (images && Array.isArray(images)) {
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image, is_main) VALUES (?, ?, ?)');
      images.forEach((img: any) => {
        insertImg.run(productId, img.url || img.image, img.is_main ? 1 : 0);
      });
    }
    return productId;
  });

  try {
    const id = transaction();
    res.status(201).json({ id, message: 'Product created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/admin/products/:id', authenticate, (req, res) => {
  const { category_id, subcategory_id, brand_id, brand_name, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery, images, features, key_points } = req.body;
  
  const transaction = db.transaction(() => {
    const update = db.prepare(`
      UPDATE products 
      SET category_id = ?, subcategory_id = ?, brand_id = ?, brand_name = ?, name = ?, slug = ?, description = ?, price = ?, promo_price = ?, stock = ?, image = ?, is_popular = ?, is_best_seller = ?, is_new = ?, is_recommended = ?, is_fast_delivery = ?, features = ?, key_points = ?
      WHERE id = ?
    `);
    update.run(category_id, subcategory_id || null, brand_id || null, brand_name || null, name, slug, description, price, promo_price, stock, image, is_popular ? 1 : 0, is_best_seller ? 1 : 0, is_new ? 1 : 0, is_recommended ? 1 : 0, is_fast_delivery ? 1 : 0, features ? JSON.stringify(features) : null, key_points ? JSON.stringify(key_points) : null, req.params.id);

    if (images && Array.isArray(images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(req.params.id);
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image, is_main) VALUES (?, ?, ?)');
      images.forEach((img: any) => {
        insertImg.run(req.params.id, img.url || img.image, img.is_main ? 1 : 0);
      });
    }
  });

  try {
    transaction();
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/admin/products/:id', authenticate, (req, res) => {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE order_items SET product_id = NULL WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reviews WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  });

  try {
    transaction();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/admin/categories', authenticate, (req, res) => {
  const { name, slug, image } = req.body;
  try {
    const insert = db.prepare('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)');
    const info = insert.run(name, slug, image);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Category created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/admin/categories/:id', authenticate, (req, res) => {
  const { name, slug, image } = req.body;
  try {
    const update = db.prepare('UPDATE categories SET name = ?, slug = ?, image = ? WHERE id = ?');
    update.run(name, slug, image, req.params.id);
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.post('/admin/brands', authenticate, (req, res) => {
  const { name, slug, image, description } = req.body;
  try {
    const insert = db.prepare('INSERT INTO brands (name, slug, image, description) VALUES (?, ?, ?, ?)');
    const info = insert.run(name, slug, image, description);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

router.put('/admin/brands/:id', authenticate, (req, res) => {
  const { name, slug, image, description } = req.body;
  try {
    const update = db.prepare('UPDATE brands SET name = ?, slug = ?, image = ?, description = ? WHERE id = ?');
    update.run(name, slug, image, description, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

router.delete('/admin/brands/:id', authenticate, (req, res) => {
  try {
    // Check if brand is used in products
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE brand_id = ?').get(req.params.id) as any;
    if (productsCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete brand with associated products' });
    }
    
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

router.delete('/admin/categories/:id', authenticate, (req, res) => {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE products SET category_id = NULL, subcategory_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM subcategories WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  });

  try {
    transaction();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

router.post('/admin/subcategories', authenticate, (req, res) => {
  const { category_id, name, slug, image } = req.body;
  try {
    const insert = db.prepare('INSERT INTO subcategories (category_id, name, slug, image) VALUES (?, ?, ?, ?)');
    const info = insert.run(category_id, name, slug, image);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Subcategory created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

router.put('/admin/subcategories/:id', authenticate, (req, res) => {
  const { category_id, name, slug, image } = req.body;
  try {
    const update = db.prepare('UPDATE subcategories SET category_id = ?, name = ?, slug = ?, image = ? WHERE id = ?');
    update.run(category_id, name, slug, image, req.params.id);
    res.json({ message: 'Subcategory updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

router.delete('/admin/subcategories/:id', authenticate, (req, res) => {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?').run(req.params.id);
    db.prepare('DELETE FROM subcategories WHERE id = ?').run(req.params.id);
  });

  try {
    transaction();
    res.json({ message: 'Subcategory deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

// --- WILAYAS ROUTES ---
router.get('/wilayas', (req, res) => {
  const wilayas = db.prepare('SELECT * FROM wilayas ORDER BY number ASC').all();
  res.json(wilayas);
});

router.post('/admin/wilayas', authenticate, (req, res) => {
  const { number, name, delivery_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    const insert = db.prepare('INSERT INTO wilayas (number, name, delivery_cost, is_active) VALUES (?, ?, ?, ?)');
    const info = insert.run(number, name, delivery_cost, is_active !== undefined ? (is_active ? 1 : 0) : 1);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Wilaya ajoutée' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ce numéro de wilaya existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la wilaya' });
  }
});

router.put('/admin/wilayas/:id', authenticate, (req, res) => {
  const { number, name, delivery_cost, is_active } = req.body;
  
  if (!number || !name || delivery_cost === undefined) {
    return res.status(400).json({ error: 'Numéro, nom et tarif sont requis' });
  }

  try {
    const update = db.prepare('UPDATE wilayas SET number = ?, name = ?, delivery_cost = ?, is_active = ? WHERE id = ?');
    update.run(number, name, delivery_cost, is_active ? 1 : 0, req.params.id);
    res.json({ message: 'Wilaya modifiée' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ce numéro de wilaya existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la modification de la wilaya' });
  }
});

router.delete('/admin/wilayas/:id', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM wilayas WHERE id = ?').run(req.params.id);
    res.json({ message: 'Wilaya supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la wilaya' });
  }
});

export default router;
