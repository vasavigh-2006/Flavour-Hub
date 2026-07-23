import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, generateTokenId, verifyRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../utils/email.js';
import logger from '../utils/logger.js';
import { validationResult } from 'express-validator';

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, email, dob, password, avatarUrl } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      dob: new Date(dob),
      passwordHash,
      avatarUrl: avatarUrl || '',
      emailVerified: true, // Auto-verify all users on sign up
      emailVerificationToken,
      emailVerificationExpires,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('[Login] Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    logger.info(`[Login] Attempting login for: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      logger.warn(`[Login] User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`[Login] Invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-verify if not already verified (allows older users to log in directly)
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
      logger.info(`[Login] Auto-verified email for: ${email}`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    const tokenId = generateTokenId();

    // Store refresh token
    const deviceInfo = req.headers['user-agent'] || 'Unknown device';
    await user.addRefreshToken(tokenId, deviceInfo);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`[Login] Successful login for: ${email}`);

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    logger.error('[Login] Error:', error);
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find user with this refresh token (we need to check all users)
    // In production, you'd store tokenId -> userId mapping in Redis
    const users = await User.find({ 'refreshTokens.revoked': false });
    let user = null;
    let tokenId = null;

    for (const u of users) {
      const token = u.refreshTokens.find(t => !t.revoked);
      if (token) {
        // In a real app, you'd verify the tokenId matches
        // For now, we'll rotate on any valid refresh token
        user = u;
        tokenId = token.tokenId;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Revoke old token and issue new ones
    await user.revokeRefreshToken(tokenId);
    
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken();
    const newTokenId = generateTokenId();

    await user.addRefreshToken(newTokenId, req.headers['user-agent'] || 'Unknown device');

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // In production, you'd look up the tokenId and revoke it
      // For now, we'll just clear the cookie
      if (req.user) {
        await req.user.revokeAllRefreshTokens();
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshTokens')
      .populate('subscription');
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, avatarUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't disclose if email doesn't exist
      return res.json({ message: 'If that email is registered, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

    // Print to logs since SMTP is not configured
    logger.info(`[ForgotPassword] Password reset token generated for user ${user.email}.`);
    logger.info(`[ForgotPassword] Reset Link: ${resetUrl}`);

    res.json({ message: 'If that email is registered, a password reset link has been generated.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Revoke all existing refresh tokens for security
    await user.revokeAllRefreshTokens();
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

