export interface ProductVariation {
  attribute: string;
  value: string;
  price?: number;
  stock?: number;
}

export interface Product {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  promo_price?: number | null;
  promo_price_start_date?: string | null;
  promo_price_end_date?: string | null;
  stock: number;
  image?: string;
  images?: string[] | string;
  category_id?: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  brand_slug?: string;
  variations?: string | ProductVariation[];
  is_popular?: boolean;
  is_best_seller?: boolean;
  is_new?: boolean;
  avg_rating?: number;
  reviews_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  slide_image?: string;
  mobile_slide_image?: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  image?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  seo_title?: string;
}

export interface CartItem {
  product_id: number | string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  quantity: number;
  image?: string;
  variation?: string | null;
  max_stock: number;
}

export interface Wilaya {
  id: number;
  number: number;
  name: string;
  shipping_fee: number;
  stop_desk_fee?: number;
  is_active: boolean;
}

export interface Commune {
  id: number;
  wilaya_id: number;
  name: string;
  shipping_fee?: number;
}

export interface StopDesk {
  id: number | string;
  wilaya_id: number;
  wilaya_name?: string;
  name: string;
  address?: string;
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  variation?: string | null;
}

export interface Order {
  id: number;
  order_id?: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_cost: number;
  delivery_type?: 'home' | 'stopdesk';
  shipping_address?: string;
  shipping_wilaya?: string;
  shipping_commune?: string;
  shipping_office?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
}

export interface HeroBanner {
  id: number;
  title?: string;
  description?: string;
  image_desktop?: string;
  image_mobile?: string;
  image_url?: string;
  mobile_image_url?: string;
  button_link?: string;
  button_text?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  full_address?: string;
}
