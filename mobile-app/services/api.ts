import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  accessToken?: string;
  refreshToken?: string;
}

const getDefaultApiUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured;

  // Expo host URI usually looks like 192.168.1.10:8081 in development.
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any)?.manifest?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3000`;
  }

  // Android emulator maps host machine localhost to 10.0.2.2.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

export const API_URL = getDefaultApiUrl();

console.log(`[API] Using base URL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await SecureStore.getItemAsync("secure_refresh_token");
    if (!refreshToken) return null;

    try {
      const response = await api.post<AuthResponse>("/api/auth/refresh", { refreshToken });
      const newAccessToken = response.data.accessToken || response.data.token;
      const newRefreshToken = response.data.refreshToken;

      if (newAccessToken) {
        await SecureStore.setItemAsync("secure_auth_token", newAccessToken);
      }
      if (newRefreshToken) {
        await SecureStore.setItemAsync("secure_refresh_token", newRefreshToken);
      }

      return newAccessToken ?? null;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

const resolveAuthFallbackPath = (path: string) => {
  if (path.startsWith('/api/auth/')) {
    return path.replace('/api/auth/', '/auth/');
  }
  if (path.startsWith('/auth/')) {
    return path.replace('/auth/', '/api/auth/');
  }
  return null;
};

const authRequestWithFallback = async <T>(method: 'get' | 'post', path: string, data?: Record<string, any>) => {
  try {
    if (method === 'get') {
      return await api.get<T>(path);
    }
    return await api.post<T>(path, data);
  } catch (error: any) {
    const fallbackPath = resolveAuthFallbackPath(path);
    const status = error?.response?.status;

    if (fallbackPath && status === 404) {
      if (method === 'get') {
        return api.get<T>(fallbackPath);
      }
      return api.post<T>(fallbackPath, data);
    }

    throw error;
  }
};

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("secure_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle JWT expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const method = error?.config?.method?.toUpperCase?.() || 'REQUEST';
    const url = error?.config?.url || 'unknown-url';
    const message = error?.response?.data?.error || error?.message;

    if (status) {
      console.warn(`[API] ${method} ${url} failed (${status}): ${message}`);
    } else {
      console.warn(`[API] ${method} ${url} failed: ${message}`);
    }

    if (error.response && error.response.status === 401) {
      const originalRequest = (error.config || {}) as any;
      const shouldTryRefresh =
        !originalRequest._retry &&
        !String(originalRequest.url || "").includes("/api/auth/login") &&
        !String(originalRequest.url || "").includes("/api/auth/refresh");

      if (shouldTryRefresh) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }

      await SecureStore.deleteItemAsync("secure_auth_token");
      await SecureStore.deleteItemAsync("secure_refresh_token");
    }
    return Promise.reject(error);
  }
);

export const carsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/api/cars', { params }),
  getOne: (id: number) => api.get(`/api/cars/${id}`),
};

export const bookingsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/api/bookings', { params }),
  getOne: (id: number) => api.get(`/api/bookings/${id}`),
  create: (data: Record<string, any>) => api.post('/api/bookings', data),
  update: (id: number, data: Record<string, any>) => api.put(`/api/bookings/${id}`, data),
  cancel: (id: number) => api.patch(`/api/bookings/${id}/cancel`),
};

export const rentalsAPI = {
  getAll: (params?: Record<string, any>) => api.get('/api/rentals', { params }),
  getOne: (id: number) => api.get(`/api/rentals/${id}`),
  create: (data: Record<string, any>) => api.post('/api/rentals', data),
  update: (id: number, data: Record<string, any>) => api.put(`/api/rentals/${id}`, data),
};

export const customersAPI = {
  getAll: (params?: Record<string, any>) => api.get('/api/customers', { params }),
  getOne: (id: number) => api.get(`/api/customers/${id}`),
  create: (data: Record<string, any>) => api.post('/api/customers', data),
  update: (id: number, data: Record<string, any>) => api.put(`/api/customers/${id}`, data),
};

export const maintenanceAPI = {
  getAll: (params?: Record<string, any>) => api.get('/api/maintenance', { params }),
  getOne: (id: number) => api.get(`/api/maintenance/${id}`),
  create: (data: Record<string, any>) => api.post('/api/maintenance', data),
  update: (id: number, data: Record<string, any>) => api.put(`/api/maintenance/${id}`, data),
};

export const gpsAPI = {
  getLive: (carId?: string) => api.get(`/api/gps/live${carId ? `?carId=${carId}` : ''}`),
  updatePosition: (carId: string, data: { latitude: number; longitude: number; speed?: number; heading?: number }) =>
    api.post('/api/gps/live', { carId, ...data }),
};

export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getRecentActivity: () => api.get('/api/dashboard/activity'),
};

export const authAPI = {
  login: (email: string, password: string) =>
    authRequestWithFallback<AuthResponse>('post', '/api/auth/login', { email, password }),
  signup: (data: Record<string, any>) => authRequestWithFallback('post', '/api/auth/register', data),
  forgotPassword: (email: string) => authRequestWithFallback('post', '/api/auth/forgot-password', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    authRequestWithFallback('post', '/api/auth/reset-password', { email, token, newPassword }),
  logout: () => authRequestWithFallback('post', '/api/auth/logout'),
  me: () => authRequestWithFallback<{ user: AuthUser }>('get', '/api/auth/me'),
  google: (idToken: string) => authRequestWithFallback<AuthResponse>('post', '/api/auth/google', { idToken }),
  apple: (identityToken: string, fullName?: any) => authRequestWithFallback<AuthResponse>('post', '/api/auth/apple', { identityToken, fullName }),
  sendOtp: (phone: string, channel: 'sms' | 'whatsapp' = 'sms') =>
    authRequestWithFallback('post', '/api/auth/send-otp', { phone, channel }),
  verifyOtp: (data: { phone: string; code: string; name?: string; email?: string }) =>
    authRequestWithFallback<AuthResponse>('post', '/api/auth/verify-otp', data),
  refresh: (refreshToken: string) => authRequestWithFallback<AuthResponse>('post', '/api/auth/refresh', { refreshToken }),
};

export const pricingAPI = {
  calculate: (data: {
    carId: string;
    pickupDate: string;
    dropoffDate: string;
    pickupLocation: string;
    distance?: number;
    promoCode?: string;
  }) => api.post('/api/pricing/calculate', data),
  getEstimate: (params: {
    carId: string;
    pickupDate: string;
    dropoffDate: string;
    pickupLocation: string;
  }) => api.get('/api/pricing/calculate', { params }),
};

export const notificationsAPI = {
  registerDevice: (data: {
    deviceToken: string;
    deviceType: 'ios' | 'android' | 'web';
    deviceName?: string;
  }) => api.post('/api/notifications/register', data),
  unregisterDevice: (deviceToken: string) => api.delete(`/api/notifications/register?deviceToken=${deviceToken}`),
  getDevices: () => api.get('/api/notifications/register'),
};

export const paymentsAPI = {
  createPaymentIntent: (data: {
    bookingId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) => api.post('/api/payments/create-intent', data),
  calculateTotal: (data: {
    carId: string;
    pickupDate: string;
    dropoffDate: string;
    pickupLocation: string;
    distance?: number;
    promoCode?: string;
  }) => api.post('/api/payments/calculate-total', data),
  confirmPayment: (paymentIntentId: string) => api.post(`/api/payments/confirm/${paymentIntentId}`),
  refundPayment: (paymentIntentId: string, amount?: number) => api.post(`/api/payments/refund/${paymentIntentId}`, { amount }),
};

export default api;
