import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = () => {
  return jwt.sign({}, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

export const generateTokenId = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

