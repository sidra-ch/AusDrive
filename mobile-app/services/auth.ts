import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { authAPI } from './api';

export const AuthService = {
  async login(email: string, password: string) {
    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;
      
      // Store token and user data
      if (token) {
        await AsyncStorage.setItem('auth_token', token);
      }
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user };
    } catch (error: any) {
      console.error('Login error:', error.message);
      console.error('Response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  },

  async logout() {
    try {
      await authAPI.logout();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  async getUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  async isAuthenticated() {
    const [user, token] = await Promise.all([
      this.getUser(),
      AsyncStorage.getItem('auth_token')
    ]);
    return !!user && !!token;
  },
};
