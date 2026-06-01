import { User, Product, Cart, Wishlist, Order, SalesStats, Coupon, Review, Address } from '../types';

const API_BASE = '/api';

// Retrieve secure JWT token
export function getAuthToken(): string | null {
  return localStorage.getItem('ecommerce_token');
}

// Store secure JWT token
export function setAuthToken(token: string) {
  localStorage.setItem('ecommerce_token', token);
}

// Wipe secure authed state
export function removeAuthToken() {
  localStorage.removeItem('ecommerce_token');
}

// Request dispatcher automatically appending authentication
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during API communication.');
  }

  return data as T;
}

// API Client SDK implementation
export const api = {
  // Authentication APIs
  auth: {
    register: (name: string, email: string, password: string) => 
      apiRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
      
    login: (email: string, password: string) => 
      apiRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
      
    me: () => 
      apiRequest<{ user: User }>('/auth/me'),
      
    updateProfile: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => 
      apiRequest<{ user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      
    addAddress: (address: Address) => 
      apiRequest<{ user: User }>('/auth/addresses', {
        method: 'POST',
        body: JSON.stringify({ address }),
      }),
      
    setDefaultAddress: (index: number) => 
      apiRequest<{ user: User }>('/auth/addresses/default', {
        method: 'PUT',
        body: JSON.stringify({ index }),
      }),
      
    deleteAddress: (index: number) => 
      apiRequest<{ user: User }>(`/auth/addresses/${index}`, {
        method: 'DELETE',
      }),
  },

  // Products APIs
  products: {
    list: (params: { 
      search?: string; 
      category?: string; 
      brand?: string; 
      minPrice?: number; 
      maxPrice?: number; 
      sort?: string; 
      page?: number; 
      limit?: number; 
    } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          query.set(key, String(val));
        }
      });
      return apiRequest<{
        products: Product[];
        totalCount: number;
        categories: string[];
        brands: string[];
        page: number;
        limit: number;
        totalPages: number;
      }>(`/products?${query.toString()}`);
    },

    getFeatured: () => 
      apiRequest<{ featured: Product[]; bestSellers: Product[]; newest: Product[] }>('/products/featured'),

    getById: (id: string) => 
      apiRequest<{ product: Product; related: Product[] }>(`/products/${id}`),

    create: (productData: Partial<Product>) => 
      apiRequest<{ product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      }),

    update: (id: string, productData: Partial<Product>) => 
      apiRequest<{ product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      }),

    delete: (id: string) => 
      apiRequest<{ success: boolean; message: string }>(`/products/${id}`, {
        method: 'DELETE',
      }),

    submitReview: (productId: string, rating: number, comment: string) => 
      apiRequest<{ product: Product }>(`/products/${productId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      }),
  },

  // Cart APIs
  cart: {
    get: () => 
      apiRequest<Cart>('/cart'),
      
    sync: (items: any[]) => 
      apiRequest<Cart>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
      
    add: (productId: string, quantity: number) => 
      apiRequest<Cart>('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }),
      
    update: (productId: string, quantity: number) => 
      apiRequest<Cart>('/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity }),
      }),
      
    remove: (productId: string) => 
      apiRequest<Cart>('/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId }),
      }),
      
    applyCoupon: (code: string, subtotal: number) => 
      apiRequest<{
        valid: boolean;
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        discountAmount: number;
        description: string;
      }>('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),
  },

  // Wishlist APIs
  wishlist: {
    get: () => 
      apiRequest<Wishlist>('/wishlist'),
      
    toggle: (productId: string) => 
      apiRequest<{ wishlist: Wishlist; action: 'added' | 'removed' }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
  },

  // Orders APIs
  orders: {
    list: () => 
      apiRequest<Order[]>('/orders'),
      
    getById: (id: string) => 
      apiRequest<Order>(`/orders/${id}`),
      
    place: (data: {
      products: any[];
      shippingAddress: Address;
      totalAmount: number;
      discountAmount?: number;
      couponCode?: string;
      paymentMethod?: string;
    }) => 
      apiRequest<{ message: string; order: Order }>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Admin Dashboard APIs
  admin: {
    getStats: () => 
      apiRequest<SalesStats>('/admin/stats'),
      
    getUsers: () => 
      apiRequest<User[]>('/admin/users'),
      
    updateUser: (id: string, role: string) => 
      apiRequest<{ user: User }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
      
    deleteUser: (id: string) => 
      apiRequest<{ success: boolean; message: string }>(`/admin/users/${id}`, {
        method: 'DELETE',
      }),
      
    getOrders: () => 
      apiRequest<Order[]>('/admin/orders'),
      
    updateOrderStatus: (id: string, status: string, description?: string) => 
      apiRequest<{ message: string; order: Order }>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, description }),
      }),
  }
};
