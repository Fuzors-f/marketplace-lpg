import { create } from 'zustand';
import api from '../api/axios';

const useItemStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/items');
      set({ items: response.data.data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch items', 
        loading: false 
      });
    }
  },

  createItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/items', itemData);
      set((state) => ({ 
        items: [response.data.data, ...state.items], 
        loading: false 
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create item', 
        loading: false 
      });
      return false;
    }
  },

  updateItem: async (id, itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/items/${id}`, itemData);
      set((state) => ({
        items: state.items.map(item => 
          item._id === id ? response.data.data : item
        ),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update item', 
        loading: false 
      });
      return false;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/items/${id}`);
      set((state) => ({
        items: state.items.filter(item => item._id !== id),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete item', 
        loading: false 
      });
      return false;
    }
  }
}));

export default useItemStore;
