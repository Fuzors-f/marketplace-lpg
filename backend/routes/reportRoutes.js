import express from 'express';
import {
  getBestSellers,
  getSalesReport,
  getRevenueByPaymentMethod
} from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/best-sellers', getBestSellers);
router.get('/sales', getSalesReport);
router.get('/revenue-by-payment', getRevenueByPaymentMethod);

export default router;
