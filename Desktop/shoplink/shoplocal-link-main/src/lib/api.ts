// API service layer for ShopLink application

// Use relative URL for proxy support in development
const API_BASE_URL = '/api';

// Debug function to log API calls
function logApiCall(endpoint: string, options?: RequestInit) {
  console.log(`🔗 API Call: ${options?.method || 'GET'} ${API_BASE_URL}${endpoint}`);
}

// ==================== UNICODE/ENCODING UTILITIES ====================

/**
 * Sanitizes text by encoding to UTF-8 bytes and decoding back
 * This removes invalid Unicode characters that could break JSON parsing
 */
function sanitizeText(text: string): string {
  if (typeof text !== 'string') return text;

  const originalLength = text.length;
  try {
    // Use TextEncoder and TextDecoder for proper UTF-8 handling
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });

    // Encode to UTF-8 bytes, then decode back (this removes invalid sequences)
    const bytes = encoder.encode(text);
    const sanitized = decoder.decode(bytes);
    const sanitizedLength = sanitized.length;

    // Log if text was modified during sanitization
    if (originalLength !== sanitizedLength) {
      console.warn('🔧 Text sanitization applied:', {
        originalLength,
        sanitizedLength,
        charsRemoved: originalLength - sanitizedLength,
        preview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      });
    }

    return sanitized;
  } catch (error) {
    console.warn('🚨 Text sanitization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      textLength: originalLength,
      textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
    return text;
  }
}

/**
 * Validates JSON string and checks for potential Unicode issues
 */
function validateJsonString(jsonString: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    console.error('🔍 JSON validation failed:', {
      error: error instanceof Error ? error.message : 'Invalid JSON',
      jsonLength: jsonString.length,
      jsonPreview: jsonString.substring(0, 200) + (jsonString.length > 200 ? '...' : '')
    });
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Safely stringifies data to JSON with UTF-8 encoding
 */
function safeJsonStringify(data: any): string {
  try {
    // First, sanitize all string values in the data
    const sanitizedData = sanitizeObjectStrings(data);
    // Then stringify with ensure_ascii=False equivalent
    return JSON.stringify(sanitizedData, (key, value) => {
      // Ensure all strings are properly encoded
      if (typeof value === 'string') {
        return sanitizeText(value);
      }
      return value;
    });
  } catch (error) {
    console.error('JSON stringification failed:', error);
    throw error;
  }
}

/**
 * Recursively sanitizes all string values in an object
 */
function sanitizeObjectStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectStrings(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectStrings(value);
    }
    return sanitized;
  }

  return obj;
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
  image_url?: string | null;
  rating: number;
  reviews_count: number;
  followers_count: number;
  product_count: number;
  is_online: boolean | number; // Backend returns 1/0, frontend expects boolean
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

// Analytics interfaces
export interface ShopMetrics {
  totalViews: number;
  totalInquiries: number;
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  averageOrderValue: number;
  customerCount: number;
  productCount: number;
}

export interface ProductPerformance {
  id: number;
  name: string;
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface DailyAnalytics {
  date: string;
  views: number;
  orders: number;
  revenue: number;
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

    // Prepare request options with proper headers
    const requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // If there's a body and it's an object, stringify it safely
    if (options.body && typeof options.body === 'object') {
      try {
        const originalBody = options.body;
        const jsonString = safeJsonStringify(options.body);

        console.log(`📝 Request body processing:`, {
          endpoint,
          method: options.method || 'GET',
          originalBodySize: JSON.stringify(originalBody).length,
          sanitizedBodySize: jsonString.length,
          bodyPreview: jsonString.substring(0, 200) + (jsonString.length > 200 ? '...' : '')
        });

        // Validate the JSON before sending
        const validation = validateJsonString(jsonString);
        if (!validation.isValid) {
          console.error(`❌ Invalid JSON after sanitization:`, {
            error: validation.error,
            endpoint,
            method: options.method || 'GET'
          });
          return { error: `JSON validation failed: ${validation.error}` };
        }

        requestOptions.body = jsonString;
        console.log(`✅ JSON validation passed for ${endpoint}`);
      } catch (error) {
        console.error(`❌ JSON stringification failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint,
          method: options.method || 'GET'
        });
        return { error: 'Failed to serialize request data' };
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    console.log(`📊 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      return { error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    console.log(`📋 Response type:`, typeof data);
    console.log(`🔑 Response keys:`, data ? Object.keys(data) : 'null/undefined');

    // Handle wrapped response format from backend
    let responseData = data;

    // If the response is wrapped in a 'data' field, unwrap it
    if (data && data.data !== undefined) {
      responseData = data.data;
      console.log(`📦 Unwrapped response format:`, responseData);
      console.log(`📦 Response data type:`, typeof responseData);
      console.log(`📦 Is array:`, Array.isArray(responseData));
    }

    // Transform backend data format to frontend expected format
    if (Array.isArray(responseData)) {
      console.log(`🔄 Transforming ${responseData.length} items`);

      // Check if this is shop data or product data based on the presence of shop-specific fields
      const firstItem = responseData[0];
      const isShopData = firstItem && ('owner_id' in firstItem || 'location' in firstItem || 'business_hours' in firstItem);

      console.log(`🏪 Is shop data:`, isShopData);
      console.log(`🏪 First item keys:`, firstItem ? Object.keys(firstItem) : 'No first item');

      if (isShopData) {
        // Transform shop data
        responseData = responseData.map((item: any, index: number) => {
          console.log(`🔄 Transforming shop item ${index}:`, item.name || item.id);
          return {
            ...item,
            // Transform field names and data types for shops
            business_hours: item.business_hours || item.hours,
            hours: item.business_hours || item.hours,
            is_online: Boolean(item.is_online), // Convert 1/0 to boolean
            image_url: item.image_url,
            reviews_count: item.reviews_count || 0,
            followers_count: item.followers_count || 0,
            product_count: item.product_count || 0,
            rating: Number(item.rating) || 0,
            // Ensure required fields have defaults
            location: item.location || '',
            phone: item.phone || '',
            email: item.email || '',
            description: item.description || '',
            category: item.category || '',
            name: item.name || '',
          };
        });
      } else {
        // Transform product data - minimal transformation needed
        responseData = responseData.map((item: any, index: number) => {
          console.log(`🔄 Transforming product item ${index}:`, item.name || item.id);
          return {
            ...item,
            // Convert numeric booleans to actual booleans for products
            is_available: Boolean(item.is_available),
            is_in_stock: Boolean(item.is_in_stock),
            // Ensure numeric fields are properly typed
            price: Number(item.price) || 0,
            original_price: Number(item.original_price) || 0,
            discount_percentage: Number(item.discount_percentage) || 0,
            stock_quantity: Number(item.stock_quantity) || 0,
          };
        });
      }

      console.log(`✅ Transformation complete. Final array length:`, responseData.length);
    } else {
      console.log(`⚠️ Response data is not an array:`, typeof responseData);
    }

    // Detailed data inspection
    console.log(`📊 Final data type:`, typeof responseData);
    console.log(`📊 Final data is array:`, Array.isArray(responseData));
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log(`📊 Data length:`, responseData.length);
      console.log(`📊 First item keys:`, Object.keys(responseData[0]));
      console.log(`📊 First item sample:`, {
        id: responseData[0].id,
        name: responseData[0].name,
        category: responseData[0].category,
        is_online: responseData[0].is_online,
        image_url: responseData[0].image_url,
        location: responseData[0].location,
        phone: responseData[0].phone
      });
    }

    return { data: responseData };
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

  // Get photos for a specific product
  getByProductId: (productId: number) =>
    apiRequest<ProductPhoto[]>(`/products/${productId}/photos`),

  // Create photo for shop
  create: (shopId: number, photoData: Partial<ProductPhoto>) =>
    apiRequest<{ message: string; photo_id: number }>(
      `/shops/${shopId}/photos`,
      {
        method: 'POST',
        body: JSON.stringify(photoData),
      }
    ),

  // Create photo for specific product
  createForProduct: (productId: number, photoData: Partial<ProductPhoto>) =>
    apiRequest<{ message: string; photo_id: number }>(
      `/products/${productId}/photos`,
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

      // Sanitize filename to prevent Unicode issues
      const sanitizedName = sanitizeText(file.name);
      console.log(`📁 Original filename: ${file.name}`);
      console.log(`📁 Sanitized filename: ${sanitizedName}`);

      // Create a new file with sanitized name if needed
      let fileToUpload = file;
      if (sanitizedName !== file.name) {
        fileToUpload = new File([file], sanitizedName, { type: file.type });
      }

      formData.append('file', fileToUpload);

      const response = await fetch(`${API_BASE_URL}/upload/shop-photo`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Upload failed: ${response.status} - ${data.error}`);
        return { error: data.error || `HTTP ${response.status}` };
      }

      console.log(`✅ File uploaded successfully:`, data);
      return { data };
    } catch (error) {
      console.error(`❌ Upload error:`, error);
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },

  // Upload product photos
  uploadProductPhotos: async (files: File[]): Promise<ApiResponse<{ files: { filename: string; url: string }[] }>> => {
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();

      files.forEach((file, index) => {
        // Sanitize filename to prevent Unicode issues
        const sanitizedName = sanitizeText(file.name);
        console.log(`📁 Product photo ${index} - Original: ${file.name}, Sanitized: ${sanitizedName}`);

        // Create a new file with sanitized name if needed
        let fileToUpload = file;
        if (sanitizedName !== file.name) {
          fileToUpload = new File([file], sanitizedName, { type: file.type });
        }

        formData.append(`files`, fileToUpload);
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
        console.error(`❌ Product photos upload failed: ${response.status} - ${data.error}`);
        return { error: data.error || `HTTP ${response.status}` };
      }

      console.log(`✅ Product photos uploaded successfully:`, data);
      return { data };
    } catch (error) {
      console.error(`❌ Product photos upload error:`, error);
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

// ==================== ANALYTICS API FUNCTIONS ====================

export const analyticsApi = {
  // Get shop metrics
  getShopMetrics: (shopId: number, period: '7d' | '30d' | '90d' = '30d') =>
    apiRequest<ShopMetrics>(`/analytics/shops/${shopId}/metrics?period=${period}`),

  // Get product performance analytics
  getProductPerformance: (shopId: number, period: '7d' | '30d' | '90d' = '30d') =>
    apiRequest<ProductPerformance[]>(`/analytics/shops/${shopId}/products?period=${period}`),

  // Get daily analytics data
  getDailyAnalytics: (shopId: number, period: '7d' | '30d' | '90d' = '30d') =>
    apiRequest<DailyAnalytics[]>(`/analytics/shops/${shopId}/daily?period=${period}`),

  // Get revenue analytics
  getRevenueAnalytics: (shopId: number, period: '7d' | '30d' | '90d' = '30d') =>
    apiRequest<{ totalRevenue: number; revenueByProduct: ProductPerformance[] }>(
      `/analytics/shops/${shopId}/revenue?period=${period}`
    ),
};

// ==================== EVENTS API FUNCTIONS ====================

export interface Event {
  id: number;
  organizer_id: number;
  title: string;
  description?: string;
  category: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  cover_image?: string;
  max_attendees?: number;
  current_attendees: number;
  ticket_price: number;
  is_free: boolean;
  is_virtual: boolean;
  virtual_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  status: string;
  is_featured: boolean;
  tags?: string;
  requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  facebook_event?: string;
  instagram_post?: string;
  created_at: string;
  updated_at: string;
  organizer_name?: string;
}

export interface EventAttendee {
  id: number;
  event_id: number;
  user_id: number;
  registration_date: string;
  ticket_count: number;
  total_amount: number;
  payment_status: string;
  attendance_status: string;
  special_requests?: string;
  created_at: string;
}

export interface UserFavorite {
  id: number;
  user_id: number;
  shop_id?: number;
  product_id?: number;
  created_at: string;
  shop?: Shop;
  product?: Product;
}

export const eventApi = {
  // Get all events
  getAll: (params?: {
    category?: string;
    status?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.featured) searchParams.append('featured', '1');
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<Event[]>(`/events${queryString ? `?${queryString}` : ''}`);
  },

  // Get single event
  getById: (id: number) => apiRequest<Event>(`/events/${id}`),

  // Create event
  create: (eventData: Partial<Event>) =>
    apiRequest<{ message: string; event_id: number }>('/events', {
      method: 'POST',
      body: eventData as any,
    }),

  // Register for event
  register: (eventId: number) =>
    apiRequest<{ message: string }>(`/events/${eventId}/register`, {
      method: 'POST',
    }),
};

export const userApi = {
  // Get user favorites
  getFavorites: () =>
    apiRequest<{ shops: Shop[]; products: Product[] }>('/user/favorites'),

  // Add to favorites
  addFavorite: (data: { shop_id?: number; product_id?: number }) =>
    apiRequest<{ message: string }>('/user/favorites', {
      method: 'POST',
      body: data as any,
    }),

  // Remove from favorites
  removeFavorite: (favoriteId: number) =>
    apiRequest<{ message: string }>(`/user/favorites/${favoriteId}`, {
      method: 'DELETE',
    }),

  // Update user profile
  updateProfile: (profileData: {
    full_name?: string;
    phone?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) =>
    apiRequest<{ message: string }>('/user/profile', {
      method: 'PUT',
      body: profileData as any,
    }),
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
    case 'Event not found':
      return 'Event not found';
    case 'Event is full':
      return 'Event is full';
    case 'Already registered for this event':
      return 'Already registered for this event';
    case 'Database connection failed':
      return 'Service temporarily unavailable';
    default:
      return error || 'An unexpected error occurred';
  }
}