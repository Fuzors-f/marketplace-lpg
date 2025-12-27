import express from 'express';
import {
  getAllStock,
  getItemStock,
  addStock,
  getStockSummary
} from '../controllers/stockController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllStock);
router.get('/summary', protect, getStockSummary);
router.get('/item/:itemId', protect, getItemStock);
router.post('/', protect, addStock);

export default router;
