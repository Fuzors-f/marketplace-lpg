import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkPayTransactions,
  getAllPayments,
  getPaymentById
} from '../controllers/transactionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Transaction routes
router.post('/transactions', protect, adminOnly, createTransaction);
router.get('/transactions', protect, adminOnly, getAllTransactions);
router.get('/transactions/:id', protect, adminOnly, getTransactionById);
router.put('/transactions/:id', protect, adminOnly, updateTransaction);
router.delete('/transactions/:id', protect, adminOnly, deleteTransaction);

// Bulk payment route
router.post('/transactions/bulk-pay', protect, adminOnly, bulkPayTransactions);

// Payment routes
router.get('/payments', protect, adminOnly, getAllPayments);
router.get('/payments/:id', protect, adminOnly, getPaymentById);

export default router;
