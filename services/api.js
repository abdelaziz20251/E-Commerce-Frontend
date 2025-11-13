import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with no-cache headers
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('accessToken', access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),
  
  register: (userData) =>
    api.post('/users/register/', userData),
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  getCurrentUser: () =>
    api.get('/users/me/'),
  
  updateProfile: (userData) =>
    api.patch('/users/me/', userData),
  
  changePassword: (passwordData) =>
    api.post('/users/change-password/', passwordData),
  
  getWallet: () =>
    api.get('/users/wallet/'),
};

// Products API
export const productsAPI = {
  getAll: (params) =>
    api.get('/products/', { params }),
  
  getBySlug: (slug) =>
    api.get(`/products/${slug}/`),
  
  create: (productData) =>
    api.post('/products/', productData),
  
  update: (slug, productData) =>
    api.patch(`/products/${slug}/`, productData),
  
  delete: (slug) =>
    api.delete(`/products/${slug}/`),
  
  addReview: (slug, reviewData) =>
    api.post(`/products/${slug}/add_review/`, reviewData),
};

// Reviews API
export const reviewsAPI = {
  getAll: (params) =>
    api.get('/reviews/', { params }),
  
  getByProduct: (productId) =>
    api.get('/reviews/', { params: { product: productId } }),
  
  create: (reviewData) =>
    api.post('/reviews/', reviewData),
  
  update: (id, reviewData) =>
    api.put(`/reviews/${id}/`, reviewData),
  
  delete: (id) =>
    api.delete(`/reviews/${id}/`),
};

// Cart API
export const cartAPI = {
  get: () =>
    api.get('/cart/'),
  
  addItem: (productId, quantity = 1) =>
    api.post('/cart/add_item/', { product_id: productId, quantity }),
  
  updateItem: (itemId, quantity) =>
    api.post('/cart/update_item/', { item_id: itemId, quantity }),
  
  removeItem: (itemId) =>
    api.post('/cart/remove_item/', { item_id: itemId }),
  
  clear: () =>
    api.post('/cart/clear/'),
};

// Orders API
export const ordersAPI = {
  getAll: () =>
    api.get('/orders/'),
  
  getById: (id) =>
    api.get(`/orders/${id}/`),
  
  create: (orderData) =>
    api.post('/orders/', orderData),
};

// Categories API
export const categoriesAPI = {
  getAll: () =>
    api.get('/categories/'),
  
  getBySlug: (slug) =>
    api.get(`/categories/${slug}/`),
};

// Sellers API
export const sellersAPI = {
  getDashboard: (params = {}) => {
    console.log('Calling getDashboard with params:', params);
    console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    return api.get('/sellers/profiles/dashboard/', { params });
  },
  
  getAnalytics: (days = 30) =>
    api.get(`/sellers/profiles/analytics/?days=${days}`),
  
  getOrders: (params = {}) =>
    api.get('/sellers/profiles/orders/', { params }),
  
  getOrderById: (orderId) =>
    api.get(`/sellers/orders/${orderId}/`),
  
  cancelOrder: (orderId, reason) =>
    api.post(`/sellers/orders/${orderId}/cancel_and_refund/`, { reason }),
  
  getProfile: () =>
    api.get('/sellers/profiles/my_profile/'),
  
  createProfile: (profileData) =>
    api.post('/sellers/profiles/', profileData),
  
  updateProfile: (profileData) =>
    api.patch('/sellers/profiles/my_profile/', profileData),
  
  getPayouts: () =>
    api.get('/sellers/payouts/'),
  
  requestPayout: (payoutData) =>
    api.post('/sellers/payouts/request_payout/', payoutData),
};

