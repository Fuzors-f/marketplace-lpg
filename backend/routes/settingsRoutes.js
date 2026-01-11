import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public route - get settings for footer
router.get('/', getSettings);

// Admin route - update settings (POST to same endpoint with admin privileges)
router.post('/', protect, adminOnly, updateSettings);
router.put('/', protect, adminOnly, updateSettings);

export default router;
