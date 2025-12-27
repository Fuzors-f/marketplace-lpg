import express from 'express';
import { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  resetPassword
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/activate', activateUser);
router.put('/:id/reset-password', resetPassword);

export default router;
