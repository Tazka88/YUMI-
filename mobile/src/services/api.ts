import { API_BASE_URL, IMAGE_BASE_URL } from '../config/api';
import { 
  Product, 
  Category, 
  Subcategory, 
  Brand, 
  Wilaya, 
  Commune, 
  StopDesk, 
  Order, 
  Review, 
  HeroBanner 
} from '../types';

export const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null || isNaN(Number(price))) return '0 DZD';
  const num = Math.round(Number(price));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DZD';
};

export const getImageUrl = (imagePath?: any): string => {
  if (!imagePath) return "https://placehold.co/400x400/f97316/ffffff?text=ZORANDO";
  let pathStr = "";
  if (typeof imagePath === "string") {
    pathStr = imagePath;
  } else if (typeof imagePath === "object" && imagePath !== null) {
    pathStr = imagePath.image || imagePath.url || imagePath.uri || imagePath.src || imagePath.image_url || imagePath.mobile_image_url || imagePath.path || "";
  } else {
    pathStr = String(imagePath || "");
  }
  if (!pathStr || typeof pathStr !== "string") return "https://placehold.co/400x400/f97316/ffffff?text=ZORANDO";
  pathStr = pathStr.trim();
  if (!pathStr) return "https://placehold.co/400x400/f97316/ffffff?text=ZORANDO";
  if (pathStr.startsWith("http://") || pathStr.startsWith("https://") || pathStr.startsWith("data:image")) return pathStr;
  if (pathStr.startsWith("/")) return `https://www.zorando.com${pathStr}`;
  return `https://www.zorando.com/${pathStr}`;
};

export interface ProductFilterParams {
  sort?: 'trending' | 'top_sales' | 'newest' | 'random' | 'price_asc' | 'price_desc';
  category?: number | string;
  subcategory?: number | string;
  brand?: number | string;
  search?: string;
  limit?: number;
  promo_active?: boolean;
  ids?: string;
}

export const getProducts = async (params: ProductFilterParams = {}): Promise<Product[]> => {
  const query = new URLSearchParams();
  if (params.sort) query.append('sort', params.sort);
  if (params.category) query.append('category', String(params.category));
  if (params.subcategory) query.append('subcategory', String(params.subcategory));
  if (params.brand) query.append('brand', String(params.brand));
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.promo_active) query.append('promo_active', 'true');
  if (params.ids) query.append('ids', params.ids);

  const url = `${API_BASE_URL}/products?${query.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return response.json();
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`Product not found: ${response.status}`);
  }
  return response.json();
};

export const getProductReviews = async (slug: string): Promise<Review[]> => {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(slug)}/reviews`);
  if (!response.ok) return [];
  return response.json();
};

export const submitProductReview = async (
  slug: string, 
  data: { customer_name: string; rating: number; comment: string }
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(slug)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de l’envoi de l’avis');
  }
  return response.json();
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) return [];
  return response.json();
};

export const getSubcategories = async (): Promise<Subcategory[]> => {
  const response = await fetch(`${API_BASE_URL}/subcategories`);
  if (!response.ok) return [];
  return response.json();
};

export const getBrands = async (): Promise<Brand[]> => {
  const response = await fetch(`${API_BASE_URL}/brands`);
  if (!response.ok) return [];
  return response.json();
};

export const getHeroBanners = async (): Promise<HeroBanner[]> => {
  const response = await fetch(`${API_BASE_URL}/hero-banners`);
  if (!response.ok) return [];
  return response.json();
};

export const getWilayas = async (): Promise<Wilaya[]> => {
  const response = await fetch(`${API_BASE_URL}/wilayas`);
  if (!response.ok) return [];
  return response.json();
};

export const getCommunes = async (): Promise<Commune[]> => {
  const response = await fetch(`${API_BASE_URL}/communes/public`);
  if (!response.ok) return [];
  return response.json();
};

export const getStopDesks = async (): Promise<StopDesk[]> => {
  const response = await fetch(`${API_BASE_URL}/all-stopdesks`);
  if (!response.ok) return [];
  return response.json();
};

export interface CreateOrderPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  wilaya: string;
  commune: string;
  address?: string;
  note?: string;
  items: Array<{
    product_id: number | string;
    quantity: number;
    variation?: string | null;
  }>;
  delivery_cost: number;
  customer_user_id?: string | null;
  stop_desk: boolean;
  office_id?: string | number | null;
  office_name?: string | null;
  delivery_company?: string;
}

export const createOrder = async (payload: CreateOrderPayload): Promise<{ id: number; order_id: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la création de la commande');
  }
  return response.json();
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/user/${encodeURIComponent(userId)}`);
  if (!response.ok) return [];
  return response.json();
};

export const deleteUserAccount = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/users/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur lors de la suppression');
  }
  return response.json();
};

export const registerPushToken = async (token: string, platform: 'android' | 'ios', userId?: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/mobile/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform, user_id: userId || null }),
    });
  } catch (err) {
    console.warn('Push token registration failed:', err);
  }
};
