import express from 'express';
import {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidator, register);
router.get('/verify-email', verifyEmail);
router.post('/login', authLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfileValidator, updateMe);

export default router;

