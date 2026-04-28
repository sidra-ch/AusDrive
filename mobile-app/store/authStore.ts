import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true, // initial state is loading until session is restored

  login: async (token: string, user: User) => {
    try {
      await SecureStore.setItemAsync("token", token);
      set({ token, user, isLoading: false });
    } catch (e) {
      console.error("SecureStore save error", e);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync("token");
      set({ token: null, user: null });
    } catch (e) {
      console.error("SecureStore delete error", e);
    }
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      
      // Verify token with backend to ensure it's still valid
      const response = await api.get("/auth/me");
      
      set({ token, user: response.data.user, isLoading: false });
    } catch (error) {
      console.error("Failed to restore session", error);
      // Remove invalid token
      await SecureStore.deleteItemAsync("token");
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
