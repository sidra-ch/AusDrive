import api from './api';

export interface CarRecommendation {
  id: number;
  make: string;
  model: string;
  category: string;
  daily_rate: string;
  image_url: string;
  ai_reason: string;
}

export const aiService = {
  getRecommendations: async (budget: number, category: string = 'All') => {
    try {
      const response = await api.get('/api/ai/recommendations', {
        params: { budget, category }
      });
      return response.data.recommendations as CarRecommendation[];
    } catch (error: any) {
      // Log silently to avoid console noise in demo mode
      if (error?.code !== 'ECONNABORTED') {
        console.warn('[AI Service] Recommendations unavailable (backend offline)');
      }
      return [];
    }
  },

  getSmartPricing: async (carId: number) => {
    // Placeholder for smart pricing logic
    try {
      const response = await api.get(`/api/ai/pricing?carId=${carId}`);
      return response.data;
    } catch (error: any) {
      console.warn('[AI Service] Smart pricing unavailable');
      return null;
    }
  }
};
