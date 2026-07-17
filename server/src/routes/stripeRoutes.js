import express from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
} from '../controllers/stripeController.js';
import { authenticate, requirePremium } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/cancel', authenticate, cancelSubscription);

export default router;

