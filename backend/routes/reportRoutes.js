import express from 'express';
import {
  getBestSellers,
  getSalesReport,
  getRevenueByPaymentMethod,
  testSimple
} from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Test route without auth
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Reports route working' });
});

// Another simple test
router.get('/test-simple', testSimple);

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/best-sellers', getBestSellers);
router.get('/sales', getSalesReport);
router.get('/revenue-by-payment', getRevenueByPaymentMethod);

export default router;
