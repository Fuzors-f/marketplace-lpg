import express from 'express';
import { 
  getPublicCatalog,
  getPublicItem,
  getGroupedCatalog,
  getAvailableSizes,
  getPriceRange
} from '../controllers/publicCatalogController.js';

const router = express.Router();

// All routes are public (no authentication required)
router.get('/', getPublicCatalog);
router.get('/grouped', getGroupedCatalog);
router.get('/sizes', getAvailableSizes);
router.get('/price-range', getPriceRange);
router.get('/:id', getPublicItem);

export default router;
