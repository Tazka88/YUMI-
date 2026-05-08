CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user if not exists (password: admin123)
INSERT INTO users (email, password, role)
SELECT 'admin@admin.com', '$2b$10$Gk.QStjiG/z5U6ydCbTNx.Fd8AR6A9QZKbFmzmMtkiwjk/B4jw8xK', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@admin.com');

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  slide_image TEXT,
  mobile_slide_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add slide_image column if it doesn't exist (for existing databases)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slide_image TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS mobile_slide_image TEXT;

CREATE TABLE IF NOT EXISTS slider_images (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  title TEXT,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE slider_images ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_subcategories (
  id SERIAL PRIMARY KEY,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  brand_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  promo_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  image TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  is_fast_delivery BOOLEAN DEFAULT FALSE,
  weight DECIMAL(10, 2),
  features JSONB,
  key_points JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_subcategory_id INTEGER REFERENCES sub_subcategories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variations JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Link to auth.users.id
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  wilaya VARCHAR(255),
  full_address TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255), -- e.g. Home, Office
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(255),
  wilaya VARCHAR(255),
  commune VARCHAR(255),
  address TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE,
  customer_user_id UUID, -- Link to auth.users.id or profiles.id
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(255) NOT NULL,
  wilaya VARCHAR(255) NOT NULL,
  commune VARCHAR(255),
  address TEXT NOT NULL,
  note TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_user_id VARCHAR(255);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  variation VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  wilaya VARCHAR(50) NOT NULL,
  commune VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS footer_columns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO footer_columns (id, title, order_index)
SELECT 1, 'Boutique', 1
WHERE NOT EXISTS (SELECT 1 FROM footer_columns WHERE id = 1);

INSERT INTO footer_columns (id, title, order_index)
SELECT 2, 'Informations', 2
WHERE NOT EXISTS (SELECT 1 FROM footer_columns WHERE id = 2);

INSERT INTO footer_columns (id, title, order_index)
SELECT 3, 'Service Client', 3
WHERE NOT EXISTS (SELECT 1 FROM footer_columns WHERE id = 3);

INSERT INTO footer_columns (id, title, order_index)
SELECT 4, 'Légal', 4
WHERE NOT EXISTS (SELECT 1 FROM footer_columns WHERE id = 4);

CREATE TABLE IF NOT EXISTS footer_links (
  id SERIAL PRIMARY KEY,
  column_id INTEGER REFERENCES footer_columns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Force add column if it was created before
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'discount_offer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success' or 'error'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wilayas (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  delivery_cost DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) on all tables to satisfy Supabase Security Advisor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Allow public read access to most tables we want to be visible
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON subcategories;
CREATE POLICY "Enable read access for all users" ON subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON sub_subcategories;
CREATE POLICY "Enable read access for all users" ON sub_subcategories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
CREATE POLICY "Enable read access for all users" ON brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON slider_images;
CREATE POLICY "Enable read access for all users" ON slider_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON pages;
CREATE POLICY "Enable read access for all users" ON pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON footer_columns;
CREATE POLICY "Enable read access for all users" ON footer_columns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON footer_links;
CREATE POLICY "Enable read access for all users" ON footer_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON wilayas;
CREATE POLICY "Enable read access for all users" ON wilayas FOR SELECT USING (true);

-- Allow authenticated users to manage their own data
DROP POLICY IF EXISTS "Users can manage their own profiles" ON profiles;
CREATE POLICY "Users can manage their own profiles" ON profiles FOR ALL USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can manage their own addresses" ON addresses;
CREATE POLICY "Users can manage their own addresses" ON addresses FOR ALL USING ((select auth.uid()) = profile_id);
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;
CREATE POLICY "Users can manage their own wishlists" ON wishlists FOR ALL USING ((select auth.uid()) = profile_id);
-- Orders uses a text string for customer_user_id in older data, need simple text comparison
DROP POLICY IF EXISTS "Users can manage their own orders" ON orders;
CREATE POLICY "Users can manage their own orders" ON orders FOR ALL USING ((select auth.uid())::text = customer_user_id::text);

-- If you have a custom backend or edge functions doing admin tasks, you might want a service role policy or an admin policy.

