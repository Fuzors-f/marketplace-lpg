import express from 'express';
import { 
  adminLogin,
  register, 
  login, 
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.post('/admin/login', adminLogin);

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;
