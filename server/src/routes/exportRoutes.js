import express from 'express';
import {
  exportRecipePDF,
  exportGroceryListCSV,
} from '../controllers/exportController.js';
import { authenticate, requirePremium } from '../middleware/auth.js';

const router = express.Router();

router.get('/recipe/:id/pdf', authenticate, exportRecipePDF);
router.post('/grocery-list/csv', authenticate, requirePremium, exportGroceryListCSV);

export default router;

