import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../api/axios';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      cart: null,
      cartLoading: false,
      
      // Set user and token
      setUser: (user, token) => {
        set({ user, token });
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },

      // Register user
      register: async (userData) => {
        try {
          const response = await axios.post('/auth/register', userData);
          const { user, token } = response.data;
          
          get().setUser(user, token);
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed'
          };
        }
      },

      // Login user
      login: async (email, password) => {
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          get().setUser(user, token);
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed'
          };
        }
      },

      // Logout user
      logout: () => {
        set({ user: null, token: null, cart: null });
        delete axios.defaults.headers.common['Authorization'];
      },

      // Update profile
      updateProfile: async (profileData) => {
        try {
          const response = await axios.put('/auth/profile', profileData);
          const { user } = response.data;
          
          set({ user });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Update failed'
          };
        }
      },

      // Change password
      changePassword: async (passwordData) => {
        try {
          await axios.put('/auth/password', passwordData);
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Password change failed'
          };
        }
      },

      // Get current user profile
      getProfile: async () => {
        try {
          const response = await axios.get('/auth/me');
          const { user } = response.data;
          
          set({ user });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to get profile'
          };
        }
      },

      // Fetch cart
      fetchCart: async () => {
        try {
          set({ cartLoading: true });
          const response = await axios.get('/cart');
          
          set({ cart: response.data.data, cartLoading: false });
          
          return { success: true };
        } catch (error) {
          set({ cartLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch cart'
          };
        }
      },

      // Add to cart
      addToCart: async (itemId, qty) => {
        try {
          const response = await axios.post('/cart/add', { itemId, qty });
          
          set({ cart: response.data.data });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to add to cart'
          };
        }
      },

      // Update cart item
      updateCartItem: async (itemId, qty) => {
        try {
          const response = await axios.put('/cart/update', { itemId, qty });
          
          set({ cart: response.data.data });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to update cart'
          };
        }
      },

      // Remove from cart
      removeFromCart: async (itemId) => {
        try {
          const response = await axios.delete(`/cart/remove/${itemId}`);
          
          set({ cart: response.data.data });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to remove from cart'
          };
        }
      },

      // Clear cart
      clearCart: async () => {
        try {
          const response = await axios.delete('/cart/clear');
          
          set({ cart: response.data.data });
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to clear cart'
          };
        }
      },

      // Get cart count
      getCartCount: () => {
        const { cart } = get();
        if (!cart || !cart.items) return 0;
        
        return cart.items.reduce((total, item) => total + item.qty, 0);
      },

      // Get cart total
      getCartTotal: () => {
        const { cart } = get();
        return cart?.total || 0;
      },

      // Initialize - Load user from token on app start
      initialize: async () => {
        const { token } = get();
        
        if (token) {
          // Set axios authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            // Verify token and get current user
            const response = await axios.get('/auth/me');
            
            if (response.data.success && response.data.user.type === 'user') {
              set({ user: response.data.user });
              // Also fetch cart for authenticated user
              get().fetchCart();
            } else {
              // Token invalid or user is admin, clear state
              get().logout();
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token expired or invalid, logout
            get().logout();
          }
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);

export default useUserStore;