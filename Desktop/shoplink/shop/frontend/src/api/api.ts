const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message: string
  data?: T
  timestamp?: string
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      return data
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Auth
  async signup(email: string, password: string, fullName?: string, phone?: string) {
    return this.request<{ user: any; access_token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, phone }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Users
  async getProfile() {
    return this.request('/users/profile')
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserShops() {
    return this.request('/users/shops')
  }

  async getUserEvents() {
    return this.request('/users/events')
  }

  // Shops
  async createShop(data: any) {
    return this.request('/shops', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShop(id: number) {
    return this.request(`/shops/${id}`)
  }

  async listShops(params?: { category?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams()
    if (params?.category) query.append('category', params.category)
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.offset) query.append('offset', params.offset.toString())
    return this.request(`/shops?${query.toString()}`)
  }

  async updateShop(id: number, data: any) {
    return this.request(`/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async uploadShopLogo(shopId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const token = this.getToken()
    const response = await fetch(`${API_URL}/shops/${shopId}/upload-logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    return response.json()
  }

  async uploadShopCover(shopId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const token = this.getToken()
    const response = await fetch(`${API_URL}/shops/${shopId}/upload-cover`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    return response.json()
  }

  async getShopProducts(shopId: number) {
    return this.request(`/shops/${shopId}/products`)
  }

  // Products
  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getProduct(id: number) {
    return this.request(`/products/${id}`)
  }

  async updateProduct(id: number, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: number) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  async uploadProductImage(productId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const token = this.getToken()
    const response = await fetch(`${API_URL}/products/${productId}/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    return response.json()
  }

  // Events
  async createEvent(data: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getEvent(id: number) {
    return this.request(`/events/${id}`)
  }

  async listEvents(params?: { status?: string; is_published?: boolean; limit?: number; offset?: number }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.is_published !== undefined) query.append('is_published', params.is_published.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.offset) query.append('offset', params.offset.toString())
    return this.request(`/events?${query.toString()}`)
  }

  async updateEvent(id: number, data: any) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async registerEvent(eventId: number) {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
    })
  }

  // Cart
  async getCart() {
    return this.request('/cart')
  }

  async addToCart(productId: number, quantity: number = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    })
  }

  async updateCartItem(productId: number, quantity: number) {
    return this.request(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    })
  }

  async removeFromCart(productId: number) {
    return this.request(`/cart/${productId}`, {
      method: 'DELETE',
    })
  }

  async clearCart() {
    return this.request('/cart/clear', {
      method: 'DELETE',
    })
  }

  // Orders
  async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getOrders(shopId?: number) {
    const query = shopId ? `?shop_id=${shopId}` : ''
    return this.request(`/orders${query}`)
  }

  async getOrder(id: number) {
    return this.request(`/orders/${id}`)
  }

  // Reviews
  async createShopReview(shopId: number, data: any) {
    return this.request(`/reviews/shop/${shopId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getShopReviews(shopId: number) {
    return this.request(`/reviews/shop/${shopId}`)
  }

  async createProductReview(productId: number, data: any) {
    return this.request(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getProductReviews(productId: number) {
    return this.request(`/reviews/product/${productId}`)
  }

  // Followers
  async followShop(shopId: number) {
    return this.request(`/followers/shop/${shopId}`, {
      method: 'POST',
    })
  }

  async unfollowShop(shopId: number) {
    return this.request(`/followers/shop/${shopId}`, {
      method: 'DELETE',
    })
  }

  async checkFollowStatus(shopId: number) {
    return this.request(`/followers/shop/${shopId}/check`)
  }

  // Notifications
  async getNotifications(isRead?: boolean) {
    const query = isRead !== undefined ? `?is_read=${isRead ? 1 : 0}` : ''
    return this.request(`/notifications${query}`)
  }

  async markNotificationRead(notificationId: number) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count')
  }

  // Analytics
  async getSalesAnalytics(startDate?: string, endDate?: string) {
    const query = new URLSearchParams()
    if (startDate) query.append('start_date', startDate)
    if (endDate) query.append('end_date', endDate)
    return this.request(`/analytics/sales?${query.toString()}`)
  }

  async getEventAnalytics(startDate?: string, endDate?: string) {
    const query = new URLSearchParams()
    if (startDate) query.append('start_date', startDate)
    if (endDate) query.append('end_date', endDate)
    return this.request(`/analytics/events?${query.toString()}`)
  }

  async getActivityAnalytics() {
    return this.request('/analytics/activity')
  }

  async getAlerts() {
    return this.request('/analytics/alerts')
  }
}

export const api = new ApiClient()

