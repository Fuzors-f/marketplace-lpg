import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public route - get settings for footer
router.get('/', getSettings);

// Admin route - update settings
router.put('/', protect, adminOnly, updateSettings);

export default router;
