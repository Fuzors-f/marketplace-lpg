import express from 'express';
import { 
  adminLogin,
  register, 
  login, 
  getCurrentUser,
  updateProfile,
  changePassword,
  getAllUsersForDropdown
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.post('/admin/login', adminLogin);

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// Get all users for dropdown (admin only)
router.get('/users', protect, adminOnly, getAllUsersForDropdown);

export default router;
