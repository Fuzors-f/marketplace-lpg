import express from 'express';
import {
  getPaymentMethods,
  getPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from '../controllers/paymentMethodController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getPaymentMethods)
  .post(protect, createPaymentMethod);

router.route('/:id')
  .get(getPaymentMethod)
  .put(protect, updatePaymentMethod)
  .delete(protect, deletePaymentMethod);

export default router;
