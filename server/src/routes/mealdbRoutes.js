import express from 'express';
import {
  getCategories,
  getMeal,
  search,
} from '../controllers/mealdbController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/categories', apiLimiter, getCategories);
router.get('/meals/:id', apiLimiter, getMeal);
router.get('/search', apiLimiter, search);

export default router;

