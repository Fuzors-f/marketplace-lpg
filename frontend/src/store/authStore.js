import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
  admin: JSON.parse(localStorage.getItem('admin')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/admin/login', { username, password });
      const { token, admin } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(admin));
      
      // Set axios auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ admin, token, loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        loading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    delete api.defaults.headers.common['Authorization'];
    set({ admin: null, token: null });
  },

  clearError: () => set({ error: null }),

  // Initialize - Load admin from token on app start
  initialize: async () => {
    const { token } = get();
    
    if (token) {
      // Set axios authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        // Verify token and get current admin
        const response = await api.get('/auth/me');
        
        if (response.data.success && response.data.user.type === 'admin') {
          set({ admin: response.data.user });
        } else {
          // Token invalid or user is not admin, clear state
          get().logout();
        }
      } catch (error) {
        console.error('Admin token validation failed:', error);
        // Token expired or invalid, logout
        get().logout();
      }
    }
  }
}));

export default useAuthStore;