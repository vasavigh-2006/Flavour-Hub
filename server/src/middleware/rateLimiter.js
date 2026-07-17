import rateLimit from 'express-rate-limit';

// Development vs Production limits
const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.NODE_ENV === undefined;

// Helper to check if request is from localhost
const isLocalhost = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || req.headers['x-forwarded-for'];
  if (!ip) return true; // If no IP, assume localhost in development
  const ipStr = String(ip).trim();
  return ipStr === '::1' || 
         ipStr === '127.0.0.1' || 
         ipStr === '::ffff:127.0.0.1' || 
         ipStr.startsWith('127.') ||
         ipStr.startsWith('::ffff:127.');
};

// Skip rate limiting completely for localhost in development
const skipRateLimit = (req) => {
  if (isDevelopment) {
    // In development, skip rate limiting for localhost OR if DISABLE_RATE_LIMIT is set
    if (process.env.DISABLE_RATE_LIMIT === 'true' || isLocalhost(req)) {
      return true;
    }
  }
  return false;
};

// Very high limits for development, normal for production
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 5, // Very high in development (10000 vs 5)
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100000 : 500, // Reasonable production ceiling to avoid false-positives
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

export const generatorLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 10000 : 10, // Very high in development (10000 vs 10)
  message: 'Too many generator requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});


