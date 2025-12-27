import express from 'express';
import {
  getCatalog,
  getAdminCatalog,
  addToCatalog,
  updateCatalog,
  removeFromCatalog
} from '../controllers/catalogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCatalog);
router.get('/admin', protect, getAdminCatalog);
router.post('/', protect, addToCatalog);
router.put('/:id', protect, updateCatalog);
router.delete('/:id', protect, removeFromCatalog);

export default router;
