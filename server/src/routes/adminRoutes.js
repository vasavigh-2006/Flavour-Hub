import express from 'express';
import {
  getSubscribers,
  getReports,
  updateReport,
  getStats,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/subscribers', getSubscribers);
router.get('/reports', getReports);
router.put('/reports/:id', [
  body('status').optional().isIn(['pending', 'reviewed', 'resolved', 'dismissed']),
  body('notes').optional().trim(),
], updateReport);
router.get('/stats', getStats);

export default router;

