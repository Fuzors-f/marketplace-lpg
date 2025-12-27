import { create } from 'zustand';
import api from '../api/axios';

const useStockStore = create((set) => ({
  stocks: [],
  summary: [],
  loading: false,
  error: null,

  fetchStockSummary: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/stock/summary');
      set({ summary: response.data.data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch stock summary', 
        loading: false 
      });
    }
  },

  fetchItemStock: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/stock/item/${itemId}`);
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch item stock', 
        loading: false 
      });
      return null;
    }
  },

  addStock: async (stockData) => {
    set({ loading: true, error: null });
    try {
      await api.post('/stock', stockData);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to add stock', 
        loading: false 
      });
      return false;
    }
  }
}));

export default useStockStore;
