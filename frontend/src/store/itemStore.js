import { create } from 'zustand';
import api from '../api/axios';

const useItemStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  totalCount: 0,

  fetchItems: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/items', { params });
      set({ 
        items: response.data.data, 
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        totalCount: response.data.totalCount || response.data.count,
        loading: false 
      });
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
      // Refetch to get updated pagination
      const { currentPage } = get();
      await get().fetchItems({ page: 1, limit: 12 });
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
      // Refetch to get updated pagination
      const { currentPage } = get();
      await get().fetchItems({ page: currentPage, limit: 12 });
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
