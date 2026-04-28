import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'customer' | 'admin' | 'USER' | 'STAFF' | 'SUPER_ADMIN';
  branch?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
  forceLoadingComplete: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    // We use SecureStore for sensitive tokens (Production standard)
    await SecureStore.setItemAsync('secure_auth_token', token);
    // User metadata is fine in AsyncStorage
    await AsyncStorage.setItem('user_meta', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('secure_auth_token');
    await AsyncStorage.removeItem('user_meta');
    set({ user: null, token: null, isAuthenticated: false });
  },

  forceLoadingComplete: () => set({ isLoading: false }),

  loadAuth: async () => {
    try {
      let token: string | null = null;
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
        userStr = await Promise.race([
          AsyncStorage.getItem('user_meta'),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
      } catch (e) {
        userStr = null;
      }
      
      if (token && userStr) {
        set({ 
          token, 
          user: JSON.parse(userStr), 
          isAuthenticated: true,
          isLoading: false 
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
