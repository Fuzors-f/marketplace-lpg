import express from 'express';
import { 
  checkout,
  getOrders,
  getOrder,
  cancelOrder,
  getUserTransactions
} from '../controllers/checkoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require user authentication
router.use(protect);

router.post('/', checkout);
router.get('/orders', getOrders);
router.get('/transactions', getUserTransactions);
router.get('/orders/:id', getOrder);
router.put('/orders/:id/cancel', cancelOrder);

export default router;
