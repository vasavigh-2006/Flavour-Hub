import express from 'express';
import passport from 'passport';
import '../config/passport.js';
import {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { generateAccessToken, generateRefreshToken, generateTokenId } from '../utils/jwt.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidator, register);
router.get('/verify-email', verifyEmail);
router.post('/login', authLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfileValidator, updateMe);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_ORIGIN}/login?error=google_failed` }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken();
      const tokenId = generateTokenId();
      const deviceInfo = req.headers['user-agent'] || 'Google OAuth';
      await user.addRefreshToken(tokenId, deviceInfo);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with access token in URL
      res.redirect(`${process.env.CLIENT_ORIGIN}/oauth-success?token=${accessToken}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=google_failed`);
    }
  }
);

export default router;

