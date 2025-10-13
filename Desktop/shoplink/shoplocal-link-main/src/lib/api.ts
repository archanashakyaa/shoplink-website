// API service layer for ShopLink application

const API_BASE_URL = 'http://localhost:5000/api';

// Debug function to log API calls
function logApiCall(endpoint: string, options?: RequestInit) {
  console.log(`🔗 API Call: ${options?.method || 'GET'} ${API_BASE_URL}${endpoint}`);
}

// Types for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Shop {
  id: number;
  owner_id: number;
  name: string;
  category: string;
  description: string;
  location: string;
  phone: string;
  email?: string;
  business_hours?: string;
  image_url?: string;
  rating: number;
  reviews_count: number;
  followers_count: number;
  product_count: number;
  is_online: boolean;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export interface Product {
  id: number;
  shop_id: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url?: string;
  stock_quantity: number;
  is_available: boolean;
  is_in_stock: boolean;
  created_at: string;
  updated_at: string;
  shop_name?: string;
}

export interface ProductPhoto {
  id: number;
  shop_id: number;
  product_id?: number;
  photo_url: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  shop_name?: string;
}

// Generic API helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('access_token');

    console.log(`🔗 API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    console.log(`🔑 Token present: ${!!token}`);
    if (token) {
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    console.log(`📊 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return { error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return { data };
  } catch (error) {
    console.error(`💥 API Network Error:`, error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ==================== SHOP API FUNCTIONS ====================

export const shopApi = {
  // Get all shops
  getAll: () => apiRequest<Shop[]>('/shops'),

  // Get single shop
  getById: (id: number) => apiRequest<Shop>(`/shops/${id}`),

  // Create shop
  create: (shopData: Partial<Shop>) =>
    apiRequest<{ message: string; shop_id: number }>('/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),

  // Update shop
  update: (id: number, shopData: Partial<Shop>) =>
    apiRequest<{ message: string }>(`/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    }),

  // Delete shop
  delete: (id: number) =>
    apiRequest<{ message: string }>(`/shops/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== PRODUCT API FUNCTIONS ====================

export const productApi = {
  // Get products for a shop
  getByShopId: (shopId: number) =>
    apiRequest<Product[]>(`/shops/${shopId}/products`),

  // Get single product
  getById: (id: number) =>
    apiRequest<Product>(`/products/${id}`),

  // Create product
  create: (shopId: number, productData: Partial<Product>) =>
    apiRequest<{ message: string; product_id: number }>(
      `/shops/${shopId}/products`,
      {
        method: 'POST',
        body: JSON.stringify(productData),
      }
    ),

  // Update product
  update: (id: number, productData: Partial<Product>) =>
    apiRequest<{ message: string }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  // Delete product
  delete: (id: number) =>
    apiRequest<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== PHOTO API FUNCTIONS ====================

export const photoApi = {
  // Get photos for a shop
  getByShopId: (shopId: number) =>
    apiRequest<ProductPhoto[]>(`/shops/${shopId}/photos`),

  // Create photo
  create: (shopId: number, photoData: Partial<ProductPhoto>) =>
    apiRequest<{ message: string; photo_id: number }>(
      `/shops/${shopId}/photos`,
      {
        method: 'POST',
        body: JSON.stringify(photoData),
      }
    ),

  // Delete photo
  delete: (id: number) =>
    apiRequest<{ message: string }>(`/photos/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== FILE UPLOAD API FUNCTIONS ====================

export const uploadApi = {
  // Upload shop photo
  uploadShopPhoto: async (file: File): Promise<ApiResponse<{ filename: string; url: string }>> => {
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/shop-photo`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}` };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },

  // Upload product photos
  uploadProductPhotos: async (files: File[]): Promise<ApiResponse<{ files: { filename: string; url: string }[] }>> => {
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();

      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch(`${API_BASE_URL}/upload/product-photos`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}` };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },
};

// ==================== AUTH API FUNCTIONS ====================

export const authApi = {
  // Login
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Signup
  signup: (email: string, password: string, fullName: string) =>
    apiRequest<{ access_token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    }),

  // Get current user
  getCurrentUser: () =>
    apiRequest<{ user: any }>('/auth/user'),
};

// Helper function to handle API errors
export function handleApiError(error: string): string {
  switch (error) {
    case 'Unauthorized':
      return 'Please log in to continue';
    case 'Shop not found':
      return 'Shop not found';
    case 'Product not found':
      return 'Product not found';
    case 'Database connection failed':
      return 'Service temporarily unavailable';
    default:
      return error || 'An unexpected error occurred';
  }
}