import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';

function isTokenExpiredOrExpiringSoon(token: string, bufferSecs = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000) + bufferSecs;
  } catch {
    return true;
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'USER' | 'STAFF' | 'SUPER_ADMIN';
  branch?: string;
  kycStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  phone?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
  forceLoadingComplete: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token, refreshToken) => {
    // We use SecureStore for sensitive tokens (Production standard)
    await SecureStore.setItemAsync('secure_auth_token', token);
    if (refreshToken) {
      await SecureStore.setItemAsync('secure_refresh_token', refreshToken);
    }
    // User metadata is fine in AsyncStorage
    await AsyncStorage.setItem('user_meta', JSON.stringify(user));
    set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('secure_auth_token');
    await SecureStore.deleteItemAsync('secure_refresh_token');
    await AsyncStorage.removeItem('user_meta');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  forceLoadingComplete: () => set({ isLoading: false }),

  loadAuth: async () => {
    try {
      let token: string | null = null;
      let refreshToken: string | null = null;
      let userStr: string | null = null;
      
      try {
        token = await Promise.race([
          SecureStore.getItemAsync('secure_auth_token'),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
      } catch (e) {
        token = null;
      }
      
      try {
        refreshToken = await Promise.race([
          SecureStore.getItemAsync('secure_refresh_token'),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
      } catch (e) {
        refreshToken = null;
      }

      try {
        userStr = await Promise.race([
          AsyncStorage.getItem('user_meta'),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
      } catch (e) {
        userStr = null;
      }
      
      if (token && userStr) {
        const parsedUser = JSON.parse(userStr) as User;
        let activeToken = token;
        let activeRefreshToken = refreshToken;

        // Silently refresh if access token is expired or expiring within 60s
        if (isTokenExpiredOrExpiringSoon(token) && refreshToken) {
          try {
            const res = await authAPI.refresh(refreshToken);
            const newToken = res.data.accessToken ?? res.data.token;
            const newRefresh = res.data.refreshToken ?? refreshToken;
            if (newToken) {
              await SecureStore.setItemAsync('secure_auth_token', newToken);
              if (newRefresh) await SecureStore.setItemAsync('secure_refresh_token', newRefresh);
              activeToken = newToken;
              activeRefreshToken = newRefresh ?? refreshToken;
            } else {
              // Refresh returned no token — clear auth
              await SecureStore.deleteItemAsync('secure_auth_token');
              await SecureStore.deleteItemAsync('secure_refresh_token');
              await AsyncStorage.removeItem('user_meta');
              set({ isLoading: false });
              return;
            }
          } catch {
            // Refresh failed (e.g., expired refresh token) — clear auth
            await SecureStore.deleteItemAsync('secure_auth_token');
            await SecureStore.deleteItemAsync('secure_refresh_token');
            await AsyncStorage.removeItem('user_meta');
            set({ isLoading: false });
            return;
          }
        }

        set({
          token: activeToken,
          refreshToken: activeRefreshToken,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      set({ isLoading: false });
    }
  },
}));
