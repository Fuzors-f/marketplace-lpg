import { create } from 'zustand';
import api from '../api/axios';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  payments: [],
  currentTransaction: null,
  currentPayment: null,
  users: [],
  loading: false,
  error: null,

  // Fetch all transactions with filters
  fetchTransactions: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentMethodId) queryParams.append('paymentMethodId', filters.paymentMethodId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await api.get(`/admin/transactions?${queryParams}`);
      set({ transactions: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch transactions', 
        loading: false 
      });
      return null;
    }
  },

  // Fetch single transaction by ID
  fetchTransactionById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/admin/transactions/${id}`);
      set({ currentTransaction: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch transaction', 
        loading: false 
      });
      return null;
    }
  },

  // Create new transaction
  createTransaction: async (transactionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/transactions', transactionData);
      set((state) => ({ 
        transactions: [response.data.data, ...state.transactions], 
        loading: false 
      }));
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create transaction', 
        loading: false 
      });
      throw error;
    }
  },

  // Update transaction
  updateTransaction: async (id, transactionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/admin/transactions/${id}`, transactionData);
      set((state) => ({
        transactions: state.transactions.map(transaction => 
          transaction._id === id ? response.data.data : transaction
        ),
        currentTransaction: response.data.data,
        loading: false
      }));
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update transaction', 
        loading: false 
      });
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/admin/transactions/${id}`);
      set((state) => ({
        transactions: state.transactions.filter(transaction => transaction._id !== id),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete transaction', 
        loading: false 
      });
      throw error;
    }
  },

  // Bulk pay transactions
  bulkPayTransactions: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/admin/transactions/bulk-pay', paymentData);
      
      // Update transactions in state to reflect payment
      set((state) => ({
        transactions: state.transactions.map(transaction => 
          paymentData.transactionIds.includes(transaction._id) 
            ? { ...transaction, status: 'PAID', paymentId: response.data.data._id }
            : transaction
        ),
        loading: false
      }));
      
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to process bulk payment', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch all payments with filters
  fetchPayments: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await api.get(`/admin/payments?${queryParams}`);
      set({ payments: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payments', 
        loading: false 
      });
      return null;
    }
  },

  // Fetch single payment by ID
  fetchPaymentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/admin/payments/${id}`);
      set({ currentPayment: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch payment', 
        loading: false 
      });
      return null;
    }
  },

  // Fetch users for dropdown
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/auth/users');
      set({ users: response.data.data || [], loading: false });
      return response.data.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch users', 
        loading: false 
      });
      return [];
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current transaction
  clearCurrentTransaction: () => set({ currentTransaction: null }),

  // Clear current payment
  clearCurrentPayment: () => set({ currentPayment: null })
}));

export default useTransactionStore;
