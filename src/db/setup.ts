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
}
