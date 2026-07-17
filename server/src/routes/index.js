import express from 'express';
import authRoutes from './authRoutes.js';
import recipeRoutes from './recipeRoutes.js';
import mealdbRoutes from './mealdbRoutes.js';
import stripeRoutes from './stripeRoutes.js';
import exportRoutes from './exportRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/recipes', recipeRoutes);
router.use('/external/mealdb', mealdbRoutes);
router.use('/webhooks/stripe', stripeRoutes);
router.use('/export', exportRoutes);
router.use('/admin', adminRoutes);

export default router;

