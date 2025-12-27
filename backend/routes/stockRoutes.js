import express from 'express';
import {
  getAllStock,
  getItemStock,
  addStock,
  getStockSummary,
  getDashboardStats,
  getStockHistory,
  addStockWithHistory
} from '../controllers/stockController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllStock);
router.get('/summary', protect, getStockSummary);
router.get('/dashboard-stats', protect, adminOnly, getDashboardStats);
router.get('/history/:itemId', protect, getStockHistory);
router.get('/item/:itemId', protect, getItemStock);
router.post('/', protect, addStock);
router.post('/add-with-history', protect, addStockWithHistory);

export default router;
