import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db = new Database('yumi.db');
db.pragma('foreign_keys = ON');

export function setupDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      subcategory_id INTEGER,
      brand_id INTEGER,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      price REAL NOT NULL,
      promo_price REAL,
      stock INTEGER DEFAULT 0,
      image TEXT,
      is_popular BOOLEAN DEFAULT 0,
      is_best_seller BOOLEAN DEFAULT 0,
      is_new BOOLEAN DEFAULT 0,
      is_recommended BOOLEAN DEFAULT 0,
      is_fast_delivery BOOLEAN DEFAULT 0,
      features TEXT,
      key_points TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories (id),
      FOREIGN KEY (brand_id) REFERENCES brands (id)
    );
  `);

  try {
    db.exec('ALTER TABLE products ADD COLUMN is_fast_delivery BOOLEAN DEFAULT 0;');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec('ALTER TABLE products ADD COLUMN features TEXT;');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec('ALTER TABLE products ADD COLUMN key_points TEXT;');
  } catch (e) {
    // Column might already exist
  }

  try {
    db.exec('ALTER TABLE products ADD COLUMN brand_id INTEGER REFERENCES brands(id);');
  } catch (e) {
    // Column might already exist
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      wilaya TEXT NOT NULL,
      address TEXT NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'nouvelle',
      total_amount REAL NOT NULL,
      delivery_cost REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL,
      link TEXT,
      button_text TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image TEXT NOT NULL,
      is_main BOOLEAN DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS footer_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      column_id INTEGER NOT NULL,
      order_index INTEGER DEFAULT 0
    );
  `);

  // Check if subcategory_id exists in products, if not add it
  try {
    const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
    if (!tableInfo.find(col => col.name === 'subcategory_id')) {
      db.exec("ALTER TABLE products ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id)");
    }
  } catch (err) {
    console.error("Error altering products table:", err);
  }

  // Check if image exists in subcategories, if not add it
  try {
    const tableInfo = db.prepare("PRAGMA table_info(subcategories)").all() as any[];
    if (!tableInfo.find(col => col.name === 'image')) {
      db.exec("ALTER TABLE subcategories ADD COLUMN image TEXT");
    }
  } catch (err) {
    console.error("Error altering subcategories table:", err);
  }

  // Seed admin user if not exists
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  // Seed default settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('announcement_phone', '+213 555 00 00 00');
    insertSetting.run('announcement_text', '🚚 Livraison gratuite à partir de 5 000 DA | Paiement à la livraison partout en Algérie');
    insertSetting.run('whatsapp_number', '213555000000');
  } else {
    // Ensure whatsapp_number exists
    const waExists = db.prepare('SELECT * FROM settings WHERE key = ?').get('whatsapp_number');
    if (!waExists) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('whatsapp_number', '213555000000');
    }
  }

  // Seed slides if empty
  const slideCount = db.prepare('SELECT COUNT(*) as count FROM slides').get() as { count: number };
  if (slideCount.count === 0) {
    const slides = [
      {
        title: "Soldes d'Été Yumi",
        description: "Jusqu'à -50% sur l'électroménager et les smartphones. Livraison rapide partout en Algérie.",
        image: "https://picsum.photos/seed/banner1/1200/400",
        link: "/category/all",
        button_text: "Acheter maintenant",
        order_index: 1
      },
      {
        title: "Nouvelle Collection Mode",
        description: "Découvrez les dernières tendances pour cet été. Des prix imbattables.",
        image: "https://picsum.photos/seed/banner2/1200/400",
        link: "/category/mode",
        button_text: "Découvrir",
        order_index: 2
      },
      {
        title: "Semaine de l'Électronique",
        description: "Les meilleurs PC et accessoires à prix cassés. Stock limité !",
        image: "https://picsum.photos/seed/banner3/1200/400",
        link: "/category/electronique",
        button_text: "Profiter de l'offre",
        order_index: 3
      }
    ];
    const insertSlide = db.prepare('INSERT INTO slides (title, description, image, link, button_text, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    slides.forEach(s => insertSlide.run(s.title, s.description, s.image, s.link, s.button_text, s.order_index));
  }

  // Seed categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const categories = [
      { name: 'Électronique', slug: 'electronique', image: 'https://picsum.photos/seed/electronique/400/400' },
      { name: 'TV et audio', slug: 'tv-audio', image: 'https://picsum.photos/seed/tvaudio/400/400' },
      { name: 'Électroménager', slug: 'electromenager', image: 'https://picsum.photos/seed/electromenager/400/400' },
      { name: 'Petit électroménager', slug: 'petit-electromenager', image: 'https://picsum.photos/seed/petitelectro/400/400' },
      { name: 'Maison et cuisine', slug: 'maison-cuisine', image: 'https://picsum.photos/seed/maison/400/400' },
      { name: 'Informatique', slug: 'informatique', image: 'https://picsum.photos/seed/informatique/400/400' },
      { name: 'Mode', slug: 'mode', image: 'https://picsum.photos/seed/mode/400/400' },
      { name: 'Beauté et santé', slug: 'beaute-sante', image: 'https://picsum.photos/seed/beaute/400/400' },
      { name: 'Jeux et loisirs', slug: 'jeux-loisirs', image: 'https://picsum.photos/seed/jeux/400/400' },
      { name: 'Auto et moto', slug: 'auto-moto', image: 'https://picsum.photos/seed/auto/400/400' },
      { name: 'Sport', slug: 'sport', image: 'https://picsum.photos/seed/sport/400/400' },
    ];
    const insertCat = db.prepare('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)');
    categories.forEach(c => insertCat.run(c.name, c.slug, c.image));
  }

  // Seed brands if empty
  const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
  if (brandCount.count === 0) {
    const brands = [
      { name: 'Samsung', slug: 'samsung', image: 'https://picsum.photos/seed/samsung/400/400', description: 'Leader mondial en électronique' },
      { name: 'Apple', slug: 'apple', image: 'https://picsum.photos/seed/apple/400/400', description: 'Think different' },
      { name: 'Sony', slug: 'sony', image: 'https://picsum.photos/seed/sony/400/400', description: 'Make. Believe.' },
      { name: 'LG', slug: 'lg', image: 'https://picsum.photos/seed/lg/400/400', description: 'Life is Good' },
      { name: 'Bosch', slug: 'bosch', image: 'https://picsum.photos/seed/bosch/400/400', description: 'Des technologies pour la vie' },
      { name: 'Nike', slug: 'nike', image: 'https://picsum.photos/seed/nike/400/400', description: 'Just do it' },
    ];
    const insertBrand = db.prepare('INSERT INTO brands (name, slug, image, description) VALUES (?, ?, ?, ?)');
    brands.forEach(b => insertBrand.run(b.name, b.slug, b.image, b.description));
  }

  // Seed subcategories if empty
  const subcatCount = db.prepare('SELECT COUNT(*) as count FROM subcategories').get() as { count: number };
  if (subcatCount.count === 0) {
    const subcategoriesData: Record<string, string[]> = {
      'electronique': ['Smartphones', 'Tablettes', 'Ordinateurs portables', 'Ordinateurs de bureau', 'Écrans', 'Casques et écouteurs', 'Montres connectées', 'Accessoires téléphone'],
      'tv-audio': ['Téléviseurs', 'Smart TV', 'Home cinéma', 'Haut-parleurs', 'Barres de son'],
      'electromenager': ['Réfrigérateurs', 'Machines à laver', 'Cuisinières', 'Fours', 'Congélateurs', 'Climatiseurs'],
      'petit-electromenager': ['Mixeurs', 'Cafetières', 'Bouilloires', 'Robots de cuisine', 'Friteuses', 'Grills'],
      'maison-cuisine': ['Ustensiles', 'Vaisselle', 'Décoration', 'Linge de maison', 'Rangement'],
      'informatique': ['Composants PC', 'Périphériques', 'Réseau', 'Stockage', 'Logiciels'],
      'mode': ['Vêtements Homme', 'Vêtements Femme', 'Chaussures', 'Sacs', 'Accessoires'],
      'beaute-sante': ['Soins du visage', 'Soins du corps', 'Maquillage', 'Parfums', 'Appareils de massage'],
      'jeux-loisirs': ['Consoles', 'Jeux vidéo', 'Jouets', 'Plein air', 'Jeux de société'],
      'auto-moto': ['Accessoires auto', 'Pièces détachées', 'Entretien', 'Équipement moto'],
      'sport': ['Fitness', 'Musculation', 'Sports collectifs', 'Vélos', 'Vêtements de sport']
    };

    const insertSubcat = db.prepare('INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)');
    
    for (const [catSlug, subcats] of Object.entries(subcategoriesData)) {
      const category = db.prepare('SELECT id FROM categories WHERE slug = ?').get(catSlug) as { id: number };
      if (category) {
        subcats.forEach(subcat => {
          const slug = subcat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          insertSubcat.run(category.id, subcat, slug);
        });
      }
    }
  }

  // Seed some products if empty
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (prodCount.count === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (category_id, subcategory_id, name, slug, description, price, promo_price, stock, image, is_popular, is_best_seller, is_new, is_recommended, is_fast_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Just some dummy data
    for (let i = 1; i <= 20; i++) {
      const catId = (i % 11) + 1;
      const subcat = db.prepare('SELECT id FROM subcategories WHERE category_id = ? LIMIT 1').get(catId) as { id: number };
      const subcatId = subcat ? subcat.id : null;
      
      const price = Math.floor(Math.random() * 50000) + 1000;
      const hasPromo = Math.random() > 0.7;
      const promoPrice = hasPromo ? price * 0.8 : null;
      const stock = i % 5 === 0 ? 0 : Math.floor(Math.random() * 100) + 10; // Some out of stock
      
      insertProd.run(
        catId,
        subcatId,
        `Produit Test ${i}`,
        `produit-test-${i}`,
        `Description détaillée du produit test ${i}. Ce produit est d'excellente qualité, idéal pour votre quotidien en Algérie.`,
        price,
        promoPrice,
        stock,
        `https://picsum.photos/seed/prod${i}/600/600`,
        Math.random() > 0.5 ? 1 : 0,
        Math.random() > 0.8 ? 1 : 0,
        Math.random() > 0.7 ? 1 : 0,
        Math.random() > 0.6 ? 1 : 0,
        Math.random() > 0.5 ? 1 : 0
      );
    }
  }

  // Seed footer links if empty
  const footerLinksCount = db.prepare('SELECT COUNT(*) as count FROM footer_links').get() as { count: number };
  if (footerLinksCount.count === 0) {
    const defaultLinks = [
      { name: 'Discuter avec nous', url: 'https://wa.me/123456789', column_id: 1, order_index: 0 },
      { name: 'Contactez-nous', url: '/contact', column_id: 1, order_index: 1 },
      { name: 'Comment commander ?', url: '/comment-commander', column_id: 1, order_index: 2 },
      { name: 'Modalités de Livraison', url: '/livraison', column_id: 1, order_index: 3 },
      { name: 'Retour et Remboursement', url: '/retours', column_id: 1, order_index: 4 },
      { name: 'Politique de confidentialité', url: '/confidentialite', column_id: 1, order_index: 5 },
      
      { name: 'Qui sommes-nous', url: '/a-propos', column_id: 2, order_index: 0 },
      { name: 'Conditions Générales d\'Utilisation', url: '/cgu', column_id: 2, order_index: 1 },
      { name: 'Politique de Retours et Remboursements', url: '/politique-retours', column_id: 2, order_index: 2 },
      { name: 'Livraison gratuite dès 5 000 DA', url: '/livraison-gratuite', column_id: 2, order_index: 3 },
      { name: 'Ventes Flash', url: '/ventes-flash', column_id: 2, order_index: 4 },
    ];
    
    const insertLink = db.prepare('INSERT INTO footer_links (name, url, column_id, order_index) VALUES (?, ?, ?, ?)');
    defaultLinks.forEach(l => insertLink.run(l.name, l.url, l.column_id, l.order_index));
  }

  // Seed pages if empty
  const pagesCount = db.prepare('SELECT COUNT(*) as count FROM pages').get() as { count: number };
  if (pagesCount.count === 0) {
    const defaultPages = [
      { title: 'Contactez-nous', slug: 'contact', content: '<h1>Contactez-nous</h1><p>Vous pouvez nous contacter à l\'adresse email contact@yumi.dz ou par téléphone au +213 555 00 00 00.</p>' },
      { title: 'Comment commander ?', slug: 'comment-commander', content: '<h1>Comment commander ?</h1><p>Pour commander, ajoutez vos produits au panier, validez votre commande et payez à la livraison.</p>' },
      { title: 'Modalités de Livraison', slug: 'livraison', content: '<h1>Modalités de Livraison</h1><p>Nous livrons sur les 58 wilayas d\'Algérie. Les frais de livraison varient selon la destination.</p>' },
      { title: 'Retour et Remboursement', slug: 'retours', content: '<h1>Retour et Remboursement</h1><p>Vous disposez de 7 jours pour retourner un produit défectueux.</p>' },
      { title: 'Politique de confidentialité', slug: 'confidentialite', content: '<h1>Politique de confidentialité</h1><p>Vos données personnelles sont protégées et ne seront jamais partagées avec des tiers.</p>' },
      { title: 'Qui sommes-nous', slug: 'a-propos', content: '<h1>Qui sommes-nous</h1><p>Yumi est votre boutique en ligne de confiance en Algérie.</p>' },
      { title: 'Conditions Générales d\'Utilisation', slug: 'cgu', content: '<h1>Conditions Générales d\'Utilisation</h1><p>En utilisant ce site, vous acceptez nos conditions générales.</p>' },
      { title: 'Politique de Retours et Remboursements', slug: 'politique-retours', content: '<h1>Politique de Retours et Remboursements</h1><p>Détails sur notre politique de retours.</p>' },
      { title: 'Livraison gratuite dès 5 000 DA', slug: 'livraison-gratuite', content: '<h1>Livraison gratuite</h1><p>Profitez de la livraison gratuite pour toute commande supérieure à 5 000 DA.</p>' },
      { title: 'Ventes Flash', slug: 'ventes-flash', content: '<h1>Ventes Flash</h1><p>Découvrez nos offres exceptionnelles à durée limitée !</p>' }
    ];
    
    const insertPage = db.prepare('INSERT INTO pages (title, slug, content) VALUES (?, ?, ?)');
    defaultPages.forEach(p => insertPage.run(p.title, p.slug, p.content));
  }

  // Seed settings if empty
  const settingsCount2 = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount2.count === 0) {
    const defaultSettings = [
      { key: 'social_facebook', value: 'https://facebook.com' },
      { key: 'social_instagram', value: 'https://instagram.com' },
      { key: 'social_tiktok', value: 'https://tiktok.com' },
      { key: 'social_youtube', value: 'https://youtube.com' },
      { key: 'social_facebook_visible', value: '1' },
      { key: 'social_instagram_visible', value: '1' },
      { key: 'social_tiktok_visible', value: '1' },
      { key: 'social_youtube_visible', value: '1' },
      { key: 'copyright_text', value: '© 2026 Yumi Algérie. Tous droits réservés.' },
      { key: 'contact_email', value: 'contact@yumi.dz' },
      { key: 'contact_phone', value: '+213 555 00 00 00' },
      { key: 'contact_address', value: 'Alger, Algérie' }
    ];
    
    const insertSetting2 = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(s => insertSetting2.run(s.key, s.value));
  }
}
